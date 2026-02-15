"use client";

import { cn } from "@/lib/utils";
import type { WordPrompt } from "@/lib/game-engine";

interface KeyDisplayProps {
  currentWord: WordPrompt | null;
  upcomingWords: WordPrompt[];
  currentProgress: string;
  lastResult: "correct" | "wrong" | null;
  gameActive: boolean;
  wordHistory: Array<{ word: string; correct: boolean }>;
}

export default function KeyDisplay(props: KeyDisplayProps) {
  const { currentWord, upcomingWords, currentProgress, gameActive, wordHistory } = props;

  if (!currentWord || !gameActive) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-600 text-lg font-mono">
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
      <div className="relative max-w-5xl w-full px-6 py-6 md:px-8 md:py-8 rounded-2xl bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700">
        <div className="text-2xl sm:text-3xl font-mono leading-relaxed tracking-wide flex flex-wrap gap-x-3 gap-y-2 select-none">
          {allWords.map((wordItem, i) => {
            const isCurrentWord = wordItem.status === 'current';
            const isCompleted = wordItem.status === 'completed';
            const isUpcoming = wordItem.status === 'upcoming';

            if (isCurrentWord) {
              return (
                <span key={i} className="relative inline-flex">
                  {wordItem.word.split('').map((char, charIndex) => {
                    const isTyped = charIndex < currentProgress.length;
                    const isCurrent = charIndex === currentProgress.length;
                    const isCorrect = isTyped && currentProgress[charIndex] === char;

                    return (
                      <span
                        key={charIndex}
                        className={cn(
                          "transition-colors duration-75",
                          isTyped && isCorrect && "text-primary",
                          isTyped && !isCorrect && "text-red-400",
                          !isTyped &&
                            isCurrent &&
                            "text-black dark:text-white bg-primary/30 rounded px-0.5 -mx-0.5 border-b-2 border-primary typing-cursor",
                          !isTyped && !isCurrent && "text-slate-500"
                        )}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            }

            if (isCompleted) {
              return (
                <span
                  key={i}
                  className={cn(
                    "transition-colors",
                    wordItem.correct ? "text-primary/60" : "text-red-400/60"
                  )}
                >
                  {wordItem.word}
                </span>
              );
            }

            return (
              <span
                key={i}
                className={cn("text-slate-500", isUpcoming && "opacity-80")}
              >
                {wordItem.word}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-slate-500 font-mono mt-2">
        Type the word, then press SPACE
      </p>
    </div>
  );
}
