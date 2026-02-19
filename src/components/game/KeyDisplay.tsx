"use client";

import { cn } from "@/lib/utils";
import type { WordPrompt, CharState } from "@/lib/game-engine";

interface KeyDisplayProps {
  currentWord: WordPrompt | null;
  upcomingWords: WordPrompt[];
  currentProgress: string;
  charStates: CharState[];
  awaitingSpace: boolean;
  lastResult: "correct" | "wrong" | null;
  gameActive: boolean;
  wordHistory: Array<{ word: string; correct: boolean }>;
}

export default function KeyDisplay(props: KeyDisplayProps) {
  const { currentWord, upcomingWords, currentProgress, charStates, awaitingSpace, gameActive, wordHistory } = props;

  if (!currentWord || !gameActive) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-lg font-mono">
          Press Start to begin...
        </div>
      </div>
    );
  }

  type WordItem = { word: string; status: string; correct: boolean };

  const completedWords: WordItem[] = wordHistory.map(wh => ({
    word: wh.word,
    status: 'completed',
    correct: wh.correct
  }));

  const currentWordItem: WordItem = {
    word: currentWord.word,
    status: 'current',
    correct: true
  };

  const upcomingWordItems: WordItem[] = upcomingWords.slice(0, 30).map(w => ({
    word: w.word,
    status: 'upcoming',
    correct: true
  }));

  const allWords: WordItem[] = [...completedWords, currentWordItem, ...upcomingWordItems];

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative max-w-5xl w-full px-6 py-6 md:px-8 md:py-8 rounded-2xl bg-bg-elevated border border-purple-500/10">
        <div className="text-2xl sm:text-3xl font-mono leading-relaxed tracking-wide flex flex-wrap gap-x-3 gap-y-2 select-none">
          {allWords.map((wordItem, i) => {
            const isCurrentWord = wordItem.status === 'current';
            const isCompleted = wordItem.status === 'completed';
            const isUpcoming = wordItem.status === 'upcoming';

            if (isCurrentWord) {
              const states: CharState[] =
                charStates.length === wordItem.word.length
                  ? charStates
                  : Array(wordItem.word.length).fill("untyped") as CharState[];

              return (
                <span key={i} className="relative inline-flex">
                  {wordItem.word.split('').map((char, charIndex) => {
                    const state = states[charIndex];
                    const isCursorHere = charIndex === currentProgress.length && !awaitingSpace;

                    return (
                      <span
                        key={charIndex}
                        className={cn(
                          "transition-colors duration-75 relative",
                          state === "correct" && "text-purple-400",
                          state === "incorrect" && "text-red-400 bg-red-400/10 rounded",
                          state === "untyped" && isCursorHere &&
                            "text-white bg-purple-500/30 rounded px-0.5 -mx-0.5 border-b-2 border-purple-400 animate-pulse",
                          state === "untyped" && !isCursorHere && "text-gray-500"
                        )}
                      >
                        {char}
                      </span>
                    );
                  })}
                  {awaitingSpace && (
                    <span className="inline-flex items-center ml-1 text-purple-400 animate-pulse font-bold text-lg">
                      ␣
                    </span>
                  )}
                </span>
              );
            }

            if (isCompleted) {
              return (
                <span
                  key={i}
                  className={cn(
                    "transition-colors",
                    wordItem.correct ? "text-purple-500/50" : "text-red-400/50 line-through decoration-red-400/40"
                  )}
                >
                  {wordItem.word}
                </span>
              );
            }

            return (
              <span
                key={i}
                className={cn("text-gray-600", isUpcoming && "opacity-80")}
              >
                {wordItem.word}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-500 font-mono mt-2">
        Type each character — press SPACE to advance to next word
        <span className="ml-3 text-xs text-gray-600">( Backspace to go back )</span>
      </p>
    </div>
  );
}
