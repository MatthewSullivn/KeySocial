// ========================
// KEYSOCIAL GAME ENGINE
// ========================

export type GameState = "idle" | "countdown" | "racing" | "finished";

export interface WordPrompt {
  word: string;
  timestamp: number;
}

export type CharState = "correct" | "incorrect" | "untyped";

export interface PlayerState {
  id: string;
  username: string;
  progress: number; // 0-100
  speed: number; // current WPM
  accuracy: number; // 0-100
  correctHits: number;
  totalHits: number;
  mistakes: number;
  streak: number;
  bestStreak: number;
  isFinished: boolean;
  wpm: number;
  currentWordProgress: string; // characters typed so far for current word
  awaitingSpace: boolean; // require SPACE to commit the word
  charStates: CharState[]; // per-character correct/incorrect/untyped for current word
}

export interface GameConfig {
  trackLength: number; // total words needed to win
  countdownSeconds: number;
  difficulty: "easy" | "medium" | "hard" | "insane";
  aiTargetWPM: number; // target WPM for the AI opponent
}

export interface MatchResult {
  winnerId: string;
  loserId: string;
  winnerUsername: string;
  loserUsername: string;
  winnerWPM: number;
  loserWPM: number;
  winnerAccuracy: number;
  loserAccuracy: number;
  duration: number; // in seconds
  stakeAmount: number;
}

// Word pools by difficulty
const WORD_POOLS: Record<string, string[]> = {
  easy: [
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use"
  ],
  medium: [
    "about", "after", "again", "could", "every", "first", "found", "great", "house", "know", "large", "learn", "never", "other", "place", "plant", "point", "right", "small", "sound", "spell", "still", "study", "their", "there", "these", "thing", "think", "three", "water", "where", "which", "world", "would", "write", "called", "change", "differ", "follow", "little", "mother", "number", "people", "school", "should", "system", "animal", "answer", "before", "between", "country", "through", "because", "picture", "sentence"
  ],
  hard: [
    "another", "beautiful", "complete", "different", "important", "interest", "language", "possible", "question", "remember", "something", "together", "challenge", "community", "difficult", "education", "experience", "government", "information", "knowledge", "opportunity", "particular", "recognize", "significant", "understand", "accomplish", "advantage", "appreciate", "character", "circumstance", "communicate", "contribute", "demonstrate", "development", "environment", "individual", "maintain", "organization", "participate", "performance", "perspective", "philosophy", "possibility", "professional", "relationship", "responsibility", "technology"
  ],
  insane: [
    "accountability", "authentication", "characteristic", "comprehension", "consciousness", "controversial", "demonstration", "determination", "discrimination", "effectiveness", "establishment", "extraordinary", "implementation", "infrastructure", "intellectual", "interpretation", "investigation", "manufacturing", "philosophical", "pronunciation", "qualification", "recommendation", "representative", "responsibility", "revolutionary", "simultaneously", "sophisticated", "specification", "transformation", "unconventional", "unprecedented", "administrative", "approximately", "circumstances", "communication", "concentration", "configuration", "consideration", "contemporary", "disadvantage", "distribution", "embarrassment", "entertainment", "environmental", "experimental", "identification", "inappropriate", "independence", "introduction"
  ],
};

// Default game configs by difficulty
export const DIFFICULTY_CONFIGS: Record<string, GameConfig> = {
  easy: {
    trackLength: 20,
    countdownSeconds: 3,
    difficulty: "easy",
    aiTargetWPM: 30,
  },
  medium: {
    trackLength: 25,
    countdownSeconds: 3,
    difficulty: "medium",
    aiTargetWPM: 60,
  },
  hard: {
    trackLength: 30,
    countdownSeconds: 3,
    difficulty: "hard",
    aiTargetWPM: 100,
  },
  insane: {
    trackLength: 35,
    countdownSeconds: 3,
    aiTargetWPM: 130,
    difficulty: "insane",
  },
};

export function createPlayerState(id: string, username: string): PlayerState {
  return {
    id,
    username,
    progress: 0,
    speed: 0,
    accuracy: 100,
    correctHits: 0,
    totalHits: 0,
    mistakes: 0,
    streak: 0,
    bestStreak: 0,
    isFinished: false,
    wpm: 0,
    currentWordProgress: "",
    awaitingSpace: false,
    charStates: [],
  };
}

export function generateNextWord(difficulty: string): WordPrompt {
  const pool = WORD_POOLS[difficulty] || WORD_POOLS.medium;
  const word = pool[Math.floor(Math.random() * pool.length)];
  return {
    word: word,
    timestamp: Date.now(),
  };
}

export function generateWordSequence(difficulty: string, count: number): WordPrompt[] {
  return Array.from({ length: count }, () => generateNextWord(difficulty));
}

export function processKeyPress(
  player: PlayerState,
  pressedKey: string,
  currentWord: string,
  trackLength: number,
  startTime: number
): { player: PlayerState; correct: boolean; wordCompleted: boolean } {
  const updatedPlayer = { ...player };
  const charStates: CharState[] =
    player.charStates.length === currentWord.length
      ? [...player.charStates]
      : Array(currentWord.length).fill("untyped") as CharState[];

  // ── Backspace ──
  if (pressedKey === "Backspace") {
    if (updatedPlayer.currentWordProgress.length > 0) {
      const idx = updatedPlayer.currentWordProgress.length - 1;
      charStates[idx] = "untyped";
      updatedPlayer.currentWordProgress = updatedPlayer.currentWordProgress.slice(0, -1);
      updatedPlayer.awaitingSpace = false;
    }
    updatedPlayer.charStates = charStates;
    return { player: updatedPlayer, correct: true, wordCompleted: false };
  }

  // ── Awaiting SPACE to commit word ──
  if (updatedPlayer.awaitingSpace) {
    updatedPlayer.totalHits += 1;
    if (pressedKey === " ") {
      updatedPlayer.correctHits += 1;
      updatedPlayer.awaitingSpace = false;
      updatedPlayer.currentWordProgress = "";
      updatedPlayer.charStates = [];

      updatedPlayer.streak += 1;
      updatedPlayer.bestStreak = Math.max(updatedPlayer.bestStreak, updatedPlayer.streak);
      updatedPlayer.progress = Math.min(100, (updatedPlayer.streak / trackLength) * 100);

      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        updatedPlayer.wpm = Math.round(updatedPlayer.correctHits / 5 / elapsedMinutes);
        updatedPlayer.speed = updatedPlayer.wpm;
      }

      if (updatedPlayer.streak >= trackLength) {
        updatedPlayer.isFinished = true;
        updatedPlayer.progress = 100;
      }

      updatedPlayer.accuracy = Math.round(
        (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
      );
      return { player: updatedPlayer, correct: true, wordCompleted: true };
    }

    // Wrong key while awaiting space — count mistake but don't reset
    updatedPlayer.mistakes += 1;
    updatedPlayer.accuracy = Math.round(
      (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
    );
    return { player: updatedPlayer, correct: false, wordCompleted: false };
  }

  // ── Normal character typing ──
  const currentIdx = updatedPlayer.currentWordProgress.length;
  if (currentIdx >= currentWord.length) {
    return { player: updatedPlayer, correct: false, wordCompleted: false };
  }

  const expectedChar = currentWord[currentIdx];
  updatedPlayer.totalHits += 1;
  const isCorrect = pressedKey === expectedChar;

  if (isCorrect) {
    updatedPlayer.correctHits += 1;
    charStates[currentIdx] = "correct";
  } else {
    updatedPlayer.mistakes += 1;
    charStates[currentIdx] = "incorrect";
  }

  // Always move forward
  updatedPlayer.currentWordProgress += pressedKey;
  updatedPlayer.charStates = charStates;

  // If all characters typed, wait for SPACE
  if (updatedPlayer.currentWordProgress.length >= currentWord.length) {
    updatedPlayer.awaitingSpace = true;
  }

  // Update stats
  updatedPlayer.progress = Math.min(100, (updatedPlayer.streak / trackLength) * 100);
  const elapsedMinutes = (Date.now() - startTime) / 60000;
  if (elapsedMinutes > 0) {
    updatedPlayer.wpm = Math.round(updatedPlayer.correctHits / 5 / elapsedMinutes);
    updatedPlayer.speed = updatedPlayer.wpm;
  }
  updatedPlayer.accuracy = Math.round(
    (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
  );

  return { player: updatedPlayer, correct: isCorrect, wordCompleted: false };
}

// AI Opponent logic — calibrated to hit target WPM
export function generateAIAction(
  targetWPM: number,
  _elapsedMs: number
): { correct: boolean; delay: number } {
  // Each AI action types ~1 word (avg 5 chars + 1 space = 6 chars).
  // WPM = (totalChars / 5) / minutes, so delay per word = 72000 / targetWPM (ms).
  const avgCharsPerWord = 6;
  const baseDelay = (avgCharsPerWord / (targetWPM / 60)) * 1000 / avgCharsPerWord;
  // Simplified: delay (ms) = 60000 / targetWPM per character, times chars per word
  // = (avgCharsPerWord * 60000) / (targetWPM * 5)
  const wordDelay = (avgCharsPerWord * 60000) / (targetWPM * 5);

  // Add ±15% natural variance so the bot doesn't feel robotic
  const variance = wordDelay * 0.15;
  const delay = wordDelay + (Math.random() - 0.5) * 2 * variance;

  // High accuracy for all bots (they mostly type correctly)
  const accuracy = targetWPM >= 100 ? 0.97 : targetWPM >= 60 ? 0.95 : 0.93;
  const correct = Math.random() < accuracy;

  return { correct, delay: Math.max(200, delay) };
}

// Calculate final match result
export function calculateMatchResult(
  player1: PlayerState,
  player2: PlayerState,
  duration: number,
  stakeAmount: number
): MatchResult {
  // Winner is whoever made more progress (finished first)
  const p1Wins = player1.progress >= player2.progress;
  const winner = p1Wins ? player1 : player2;
  const loser = p1Wins ? player2 : player1;

  return {
    winnerId: winner.id,
    loserId: loser.id,
    winnerUsername: winner.username,
    loserUsername: loser.username,
    winnerWPM: winner.wpm,
    loserWPM: loser.wpm,
    winnerAccuracy: winner.accuracy,
    loserAccuracy: loser.accuracy,
    duration,
    stakeAmount,
  };
}