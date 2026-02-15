"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useGameStore } from "@/store/game-store";
import { useUserStore } from "@/store/user-store";
import GameSetup from "@/components/game/GameSetup";
import KeyDisplay from "@/components/game/KeyDisplay";
import CountdownOverlay from "@/components/game/CountdownOverlay";
import GameResults from "@/components/game/GameResults";
import { recordMatchResult } from "@/lib/tapestry";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

export default function GamePage() {
  const {
    gameState,
    config,
    countdown,
    timeElapsed,
    startTime,
    player,
    opponent,
    currentWord,
    upcomingWords,
    wordHistory,
    stakeAmount,
    matchResult,
    startCountdown,
    handleKeyPress,
    updateOpponent,
    tick,
    resetGame,
  } = useGameStore();

  const { profile } = useUserStore();

  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const opponentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle keyboard input
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "racing") return;
      // Ignore modifier keys and special keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;

      e.preventDefault();

      const prevCorrectHits = useGameStore.getState().player.correctHits;
      handleKeyPress(e.key);
      const newCorrectHits = useGameStore.getState().player.correctHits;

      const correct = newCorrectHits > prevCorrectHits;
      setLastResult(correct ? "correct" : "wrong");

      // Clear previous feedback timeout
      if (resultFeedbackRef.current) clearTimeout(resultFeedbackRef.current);
      resultFeedbackRef.current = setTimeout(() => setLastResult(null), 200);
    },
    [gameState, handleKeyPress]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // Countdown & game timer
  useEffect(() => {
    if (gameState === "countdown" || gameState === "racing") {
      tickIntervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [gameState, tick]);

  // AI opponent moves
  useEffect(() => {
    if (gameState === "racing") {
      const scheduleAIMove = () => {
        const delay = 300 + Math.random() * 700; // 300-1000ms between AI moves
        opponentIntervalRef.current = setTimeout(() => {
          updateOpponent();
          if (useGameStore.getState().gameState === "racing") {
            scheduleAIMove();
          }
        }, delay);
      };
      scheduleAIMove();
    }

    return () => {
      if (opponentIntervalRef.current) clearTimeout(opponentIntervalRef.current);
    };
  }, [gameState, updateOpponent]);

  // Record match result on chain
  useEffect(() => {
    if (gameState === "finished" && matchResult && profile) {
      recordMatchOnChain();
    }
  }, [gameState, matchResult]);

  async function recordMatchOnChain() {
    if (!matchResult || !profile) return;
    try {
      await recordMatchResult(profile.id || profile.username, {
        ...matchResult,
        matchType: stakeAmount > 0 ? "ranked" : "practice",
        stakeAmount,
      });
      toast.success("Match result recorded onchain!");
    } catch (err) {
      console.error("Failed to record match:", err);
      // Non-blocking - don't worry if this fails
    }
  }

  function handleStartFromSetup() {
    setShowSetup(false);
    startCountdown();
  }

  function handlePlayAgain() {
    resetGame();
    setShowSetup(true);
    setLastResult(null);
  }

  function handleShare() {
    if (!matchResult) return;
    const text = `I just ${
      matchResult.winnerId === player.id ? "won" : "lost"
    } a KeySocial race! WPM: ${player.wpm} | Accuracy: ${player.accuracy}% 🏎️⚡ #KeySocial #Solana`;

    if (navigator.share) {
      navigator.share({ title: "KeySocial Race Result", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Result copied to clipboard!");
    }
  }

  // Setup screen
  if (showSetup && gameState === "idle") {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col transition-colors duration-300">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDuration: "8s" }}></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse pointer-events-none" style={{ animationDuration: "10s" }}></div>
        </div>
        <AppHeader />
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4">
          <GameSetup onStart={handleStartFromSetup} />
        </main>
      </div>
    );
  }

  // Results screen
  if (gameState === "finished") {
    return (
      <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col transition-colors duration-300">
        <AppHeader />
        <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
          {matchResult && (
            <GameResults
              result={matchResult}
              player={player}
              opponent={opponent}
              isPlayerWinner={matchResult.winnerId === player.id}
              onPlayAgain={handlePlayAgain}
              onShare={handleShare}
            />
          )}
        </main>
      </div>
    );
  }

  // Active game screen
  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col transition-colors duration-300">
      <CountdownOverlay count={countdown} show={gameState === "countdown"} />

      <AppHeader />

      <main className="flex-grow flex flex-col items-center justify-center relative p-4 md:p-8 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-tertiary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow pointer-events-none"></div>
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow pointer-events-none"></div>

        <div className="w-full max-w-5xl mb-8 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              Heat #{String(startTime || Date.now()).slice(-4)}{" "}
              <span className="text-gray-400 dark:text-gray-500 text-lg font-normal ml-2">
                Standard • {config.trackLength} Words
              </span>
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-secondary">
              <span className="material-icons text-base">timer</span>
              {formatClock(timeElapsed)}
            </div>
          </div>

          <div className="space-y-4 bg-card-light dark:bg-card-dark p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
            <ProgressRow
              label={`@${opponent.username || "opponent"}`}
              percent={Math.round(opponent.progress)}
              colorClass="from-purple-500 to-indigo-600"
              badge="2nd"
            />
            <ProgressRow
              label={`@${player.username || "you"}`}
              percent={Math.round(player.progress)}
              colorClass="from-pink-500 to-rose-600"
              badge="1st"
              glow
            />

            <div className="pt-2 flex items-center justify-between text-xs font-semibold opacity-70">
              <div className="flex items-center gap-2">
                <span className="material-icons text-base text-primary">bolt</span>
                <span>
                  Stake: <span className="font-mono">{stakeAmount ? `${stakeAmount} SOL` : "Practice"}</span>
                </span>
              </div>
              <div className="font-mono">
                WPM: <span className="font-bold">{player.wpm}</span> • ACC:{" "}
                <span className="font-bold">{player.accuracy}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl bg-card-light dark:bg-card-dark rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8">
          <KeyDisplay
            currentWord={currentWord}
            upcomingWords={upcomingWords}
            currentProgress={player.currentWordProgress}
            lastResult={lastResult}
            gameActive={gameState === "racing"}
            wordHistory={wordHistory}
          />
          <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
            <span>Press SPACE to commit each word</span>
            <span>
              Words: {player.streak}/{config.trackLength}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgressRow({
  label,
  percent,
  colorClass,
  badge,
  glow,
}: {
  label: string;
  percent: number;
  colorClass: string;
  badge: string;
  glow?: boolean;
}) {
  return (
    <div className="relative group">
      <div className="flex justify-between text-xs font-semibold mb-1 opacity-70">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} w-[0%] rounded-full relative ${
            glow ? "shadow-[0_0_15px_rgba(244,63,94,0.6)]" : ""
          }`}
          style={{ width: `${percent}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-80 animate-pulse"></div>
        </div>
      </div>
      <div className="absolute -right-3 -top-3 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md z-10 border-2 border-white dark:border-card-dark opacity-0 group-hover:opacity-100 transition-opacity">
        {badge}
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
