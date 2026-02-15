import { create } from "zustand";
import {
  type GameState,
  type PlayerState,
  type GameConfig,
  type WordPrompt,
  type MatchResult,
  DIFFICULTY_CONFIGS,
  createPlayerState,
  generateNextWord,
  processKeyPress,
  generateAIAction,
  calculateMatchResult,
} from "@/lib/game-engine";

interface GameStore {
  // Game state
  gameState: GameState;
  config: GameConfig;
  countdown: number;
  timeElapsed: number;
  startTime: number | null;

  // Players
  player: PlayerState;
  opponent: PlayerState;

  // Current word prompt
  currentWord: WordPrompt | null;
  wordHistory: { word: string; correct: boolean }[];
  upcomingWords: WordPrompt[];

  // Match
  stakeAmount: number;
  matchResult: MatchResult | null;
  matchType: "practice" | "ranked" | "challenge";

  // Actions
  initGame: (
    playerId: string,
    playerUsername: string,
    difficulty: string,
    matchType: "practice" | "ranked" | "challenge",
    stakeAmount: number
  ) => void;
  startCountdown: () => void;
  startRace: () => void;
  handleKeyPress: (key: string) => void;
  updateOpponent: () => void;
  tick: () => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: "idle",
  config: DIFFICULTY_CONFIGS.medium,
  countdown: 3,
  timeElapsed: 0,
  startTime: null,

  player: createPlayerState("player", "Player"),
  opponent: createPlayerState("ai", "KeyBot"),

  currentWord: null,
  wordHistory: [],
  upcomingWords: [],

  stakeAmount: 0,
  matchResult: null,
  matchType: "practice",

  initGame: (playerId, playerUsername, difficulty, matchType, stakeAmount) => {
    const config = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.medium;
    const upcoming: WordPrompt[] = [];
    for (let i = 0; i < 10; i++) {
      upcoming.push(generateNextWord(config.difficulty));
    }

    set({
      gameState: "idle",
      config,
      countdown: config.countdownSeconds,
      timeElapsed: 0,
      startTime: null,
      player: createPlayerState(playerId, playerUsername),
      opponent: createPlayerState("ai-opponent", "KeyBot"),
      currentWord: upcoming[0],
      wordHistory: [],
      upcomingWords: upcoming.slice(1),
      stakeAmount,
      matchResult: null,
      matchType,
    });
  },

  startCountdown: () => {
    set({ gameState: "countdown" });
  },

  startRace: () => {
    set({
      gameState: "racing",
      startTime: Date.now(),
    });
  },

  handleKeyPress: (key: string) => {
    const state = get();
    if (state.gameState !== "racing" || !state.currentWord || !state.startTime) return;
    if (state.player.isFinished) return;

    // Capture charStates before processing (used to determine word correctness on completion)
    const prevCharStates = state.player.charStates;

    const result = processKeyPress(
      state.player,
      key,
      state.currentWord.word,
      state.config.trackLength,
      state.startTime
    );

    // If word completed, move to next word
    if (result.wordCompleted) {
      const newUpcoming = [...state.upcomingWords];
      const nextWord = newUpcoming.shift()!;
      newUpcoming.push(generateNextWord(state.config.difficulty));

      const wordCorrect = prevCharStates.length > 0 && prevCharStates.every((s) => s === "correct");

      const newHistory = [
        ...state.wordHistory,
        { word: state.currentWord.word, correct: wordCorrect },
      ];

      set({
        player: result.player,
        currentWord: nextWord,
        upcomingWords: newUpcoming,
        wordHistory: newHistory,
      });
    } else {
      set({
        player: result.player,
      });
    }

    // Check if game should end
    if (result.player.isFinished) {
      get().endGame();
    }
  },

  updateOpponent: () => {
    const state = get();
    if (state.gameState !== "racing" || !state.startTime) return;
    if (state.opponent.isFinished) return;

    const elapsedMs = Date.now() - state.startTime;
    const action = generateAIAction(state.config.difficulty, elapsedMs);

    const updatedOpponent = { ...state.opponent };

    if (action.correct) {
      // Treat each "correct" AI action as completing one word + space.
      updatedOpponent.correctHits += 6; // ~one word (5 chars) + space
      updatedOpponent.totalHits += 6;
      updatedOpponent.streak += 1;
      updatedOpponent.bestStreak = Math.max(
        updatedOpponent.bestStreak,
        updatedOpponent.streak
      );
      updatedOpponent.progress = Math.min(
        100,
        (updatedOpponent.streak / state.config.trackLength) * 100
      );

      const elapsedMinutes = elapsedMs / 60000;
      if (elapsedMinutes > 0) {
        updatedOpponent.wpm = Math.round(
          updatedOpponent.correctHits / 5 / elapsedMinutes
        );
        updatedOpponent.speed = updatedOpponent.wpm;
      }

      if (updatedOpponent.streak >= state.config.trackLength) {
        updatedOpponent.isFinished = true;
        updatedOpponent.progress = 100;
      }
    } else {
      // AI made a mistake — just slows them down
      updatedOpponent.mistakes += 1;
      updatedOpponent.totalHits += 1;
      updatedOpponent.awaitingSpace = false;
      updatedOpponent.currentWordProgress = "";
    }

    updatedOpponent.accuracy =
      updatedOpponent.totalHits > 0
        ? Math.round(
            (updatedOpponent.correctHits / updatedOpponent.totalHits) * 100
          )
        : 100;

    set({ opponent: updatedOpponent });

    if (updatedOpponent.isFinished) {
      get().endGame();
    }
  },

  tick: () => {
    const state = get();
    if (state.gameState === "countdown") {
      const newCountdown = state.countdown - 1;
      if (newCountdown <= 0) {
        get().startRace();
      } else {
        set({ countdown: newCountdown });
      }
    } else if (state.gameState === "racing" && state.startTime) {
      set({ timeElapsed: (Date.now() - state.startTime) / 1000 });
    }
  },

  endGame: () => {
    const state = get();
    if (state.gameState === "finished") return;

    const duration = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const result = calculateMatchResult(
      state.player,
      state.opponent,
      duration,
      state.stakeAmount
    );

    set({
      gameState: "finished",
      matchResult: result,
    });
  },

  resetGame: () => {
    set({
      gameState: "idle",
      countdown: 3,
      timeElapsed: 0,
      startTime: null,
      currentWord: null,
      wordHistory: [],
      upcomingWords: [],
      matchResult: null,
    });
  },
}));
