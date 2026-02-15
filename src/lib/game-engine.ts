// ========================
// KEYSOCIAL GAME ENGINE
// ========================

export type GameState = "idle" | "countdown" | "racing" | "finished";

export interface WordPrompt {
  word: string;
  timestamp: number;
}

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
}

export interface GameConfig {
  trackLength: number; // total words needed to win
  countdownSeconds: number;
  difficulty: "easy" | "medium" | "hard" | "insane";
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
  },
  medium: {
    trackLength: 25,
    countdownSeconds: 3,
    difficulty: "medium",
  },
  hard: {
    trackLength: 30,
    countdownSeconds: 3,
    difficulty: "hard",
  },
  insane: {
    trackLength: 35,
    countdownSeconds: 3,
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
  updatedPlayer.totalHits += 1;

  // If the word is fully typed, require SPACE to commit it.
  if (updatedPlayer.awaitingSpace) {
    if (pressedKey === " ") {
      updatedPlayer.correctHits += 1; // count the correct SPACE
      updatedPlayer.awaitingSpace = false;
      updatedPlayer.currentWordProgress = "";

      // Commit word
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

    // Pressed something else instead of SPACE — reset the word
    updatedPlayer.mistakes += 1;
    updatedPlayer.awaitingSpace = false;
    updatedPlayer.currentWordProgress = "";
    updatedPlayer.accuracy = Math.round(
      (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
    );
    return { player: updatedPlayer, correct: false, wordCompleted: false };
  }

  // Normal typing (characters)
  const expectedChar = currentWord[updatedPlayer.currentWordProgress.length];
  if (pressedKey === expectedChar) {
    updatedPlayer.correctHits += 1;
    updatedPlayer.currentWordProgress += pressedKey;

    // If we just finished the word, wait for SPACE
    if (updatedPlayer.currentWordProgress === currentWord) {
      updatedPlayer.awaitingSpace = true;
    }

    updatedPlayer.progress = Math.min(100, (updatedPlayer.streak / trackLength) * 100);

    const elapsedMinutes = (Date.now() - startTime) / 60000;
    if (elapsedMinutes > 0) {
      updatedPlayer.wpm = Math.round(updatedPlayer.correctHits / 5 / elapsedMinutes);
      updatedPlayer.speed = updatedPlayer.wpm;
    }

    updatedPlayer.accuracy = Math.round(
      (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
    );

    return { player: updatedPlayer, correct: true, wordCompleted: false };
  }

  // Mistake — reset word progress so they have to retype
  updatedPlayer.mistakes += 1;
  updatedPlayer.awaitingSpace = false;
  updatedPlayer.currentWordProgress = "";
  updatedPlayer.accuracy = Math.round(
    (updatedPlayer.correctHits / updatedPlayer.totalHits) * 100
  );
  return { player: updatedPlayer, correct: false, wordCompleted: false };
}

// AI Opponent logic
export function generateAIAction(
  difficulty: string,
  elapsedMs: number
): { correct: boolean; delay: number } {
  // AI reaction time and accuracy based on difficulty
  const configs: Record<string, { baseDelay: number; accuracy: number; variance: number }> = {
    easy: { baseDelay: 800, accuracy: 0.85, variance: 300 },
    medium: { baseDelay: 500, accuracy: 0.9, variance: 200 },
    hard: { baseDelay: 300, accuracy: 0.93, variance: 150 },
    insane: { baseDelay: 200, accuracy: 0.96, variance: 100 },
  };

  const config = configs[difficulty] || configs.medium;

  // AI gets slightly faster as the race progresses (adrenaline)
  const speedBoost = Math.min(elapsedMs / 60000, 0.2); // up to 20% faster
  const delay = config.baseDelay * (1 - speedBoost) + (Math.random() - 0.5) * config.variance;
  const correct = Math.random() < config.accuracy;

  return { correct, delay: Math.max(100, delay) };
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