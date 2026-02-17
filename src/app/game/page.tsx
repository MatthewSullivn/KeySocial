"use client";

import { Suspense, useEffect, useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/game-store";
import { useUserStore } from "@/store/user-store";
import GameSetup from "@/components/game/GameSetup";
import KeyDisplay from "@/components/game/KeyDisplay";
import CountdownOverlay from "@/components/game/CountdownOverlay";
import GameResults from "@/components/game/GameResults";
import { recordMatchResult } from "@/lib/tapestry";
import { generateAIAction } from "@/lib/game-engine";
import {
  broadcastProgress,
  broadcastFinished,
  cleanupChannel,
  type ProgressPayload,
} from "@/lib/multiplayer";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

export default function GamePage() {
  return (
    <Suspense>
      <GamePageInner />
    </Suspense>
  );
}

function GamePageInner() {
  const searchParams = useSearchParams();
  const initialDifficulty = searchParams.get("difficulty") || undefined;
  const initialMode = searchParams.get("mode") || undefined;
  const initialRoomCode = searchParams.get("room") || undefined;
  const initialStakeRaw = searchParams.get("stake");
  const initialStake = initialStakeRaw ? parseFloat(initialStakeRaw) : undefined;

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
    matchMode,
    startCountdown,
    handleKeyPress,
    updateOpponent,
    tick,
    resetGame,
  } = useGameStore();

  const { profile } = useUserStore();

  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  // Reset game state when navigating to this page fresh (e.g. from feed bot cards)
  const didResetOnMount = useRef(false);
  useEffect(() => {
    if (didResetOnMount.current) return;
    didResetOnMount.current = true;
    const gs = useGameStore.getState().gameState;
    if (gs !== "idle") {
      cleanupChannel();
      resetGame();
      setShowSetup(true);
      setLastResult(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const opponentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultFeedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mpChannelRef = useRef<RealtimeChannel | null>(null);

  // Handle keyboard input
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== "racing") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "Backspace" && e.key.length !== 1) return;

      e.preventDefault();

      if (e.key === "Backspace") {
        handleKeyPress("Backspace");
        return;
      }

      const prevCorrectHits = useGameStore.getState().player.correctHits;
      handleKeyPress(e.key);
      const newCorrectHits = useGameStore.getState().player.correctHits;

      const correct = newCorrectHits > prevCorrectHits;
      setLastResult(correct ? "correct" : "wrong");

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

  // AI opponent moves (bot mode only)
  useEffect(() => {
    if (matchMode !== "bot") return;
    if (gameState === "racing") {
      const scheduleAIMove = () => {
        const store = useGameStore.getState();
        const elapsedMs = store.startTime ? Date.now() - store.startTime : 0;
        const action = generateAIAction(store.config.aiTargetWPM, elapsedMs);
        opponentIntervalRef.current = setTimeout(() => {
          updateOpponent();
          if (useGameStore.getState().gameState === "racing") {
            scheduleAIMove();
          }
        }, action.delay);
      };
      scheduleAIMove();
    }

    return () => {
      if (opponentIntervalRef.current) clearTimeout(opponentIntervalRef.current);
    };
  }, [gameState, updateOpponent, matchMode]);

  // Multiplayer: broadcast player progress (throttled ~200ms)
  useEffect(() => {
    if (matchMode !== "multiplayer" || gameState !== "racing") return;
    if (!mpChannelRef.current) return;

    if (broadcastThrottleRef.current) clearTimeout(broadcastThrottleRef.current);
    broadcastThrottleRef.current = setTimeout(() => {
      const store = useGameStore.getState();
      const p = store.player;
      const channel = mpChannelRef.current;
      if (!channel) return;

      const payload: ProgressPayload = {
        playerId: p.id,
        username: p.username,
        progress: p.progress,
        wpm: p.wpm,
        accuracy: p.accuracy,
        correctHits: p.correctHits,
        totalHits: p.totalHits,
        streak: p.streak,
        isFinished: p.isFinished,
      };
      broadcastProgress(channel, payload);
    }, 200);

    return () => {
      if (broadcastThrottleRef.current) clearTimeout(broadcastThrottleRef.current);
    };
  }, [gameState, matchMode, player.correctHits, player.streak, player.progress]);

  // Multiplayer: broadcast finish IMMEDIATELY when player finishes (separate from throttled progress)
  const didBroadcastFinish = useRef(false);
  useEffect(() => {
    if (matchMode !== "multiplayer") return;
    if (!player.isFinished || didBroadcastFinish.current) return;
    const channel = mpChannelRef.current;
    if (!channel) return;

    didBroadcastFinish.current = true;

    // Send finish broadcast immediately (not throttled)
    broadcastFinished(channel, player.id);

    // Also send a final progress update so the opponent has accurate stats
    const p = useGameStore.getState().player;
    broadcastProgress(channel, {
      playerId: p.id,
      username: p.username,
      progress: p.progress,
      wpm: p.wpm,
      accuracy: p.accuracy,
      correctHits: p.correctHits,
      totalHits: p.totalHits,
      streak: p.streak,
      isFinished: true,
    });
  }, [matchMode, player.isFinished, player.id]);

  // Record match result on Tapestry + cleanup multiplayer + payout
  const didRecordMatch = useRef(false);
  useEffect(() => {
    if (gameState === "finished" && matchResult && profile && !didRecordMatch.current) {
      didRecordMatch.current = true;
      recordMatchOnChain();
    }

    if (gameState === "finished" && matchMode === "multiplayer") {
      setTimeout(() => {
        cleanupChannel();
        mpChannelRef.current = null;
      }, 5000);
    }
  }, [gameState, matchResult]);

  async function recordMatchOnChain() {
    if (!matchResult || !profile) return;

    // In multiplayer, only the winner records the match to avoid duplicates
    if (matchMode === "multiplayer" && matchResult.winnerId !== player.id) {
      if (stakeAmount > 0) {
        toast.error("Better luck next time! Your stake has been lost.");
      }
      return;
    }

    try {
      const result = await recordMatchResult(profile.id || profile.username, {
        ...matchResult,
        matchType: stakeAmount > 0 ? "ranked" : "practice",
        stakeAmount,
      });
      toast.success("Match result recorded onchain!");

      // Trigger payout if staked match and player won
      if (stakeAmount > 0 && result?.id) {
        await claimPayout(result.id);
      }
    } catch (err) {
      console.error("Failed to record match:", err);
    }
  }

  async function claimPayout(matchContentId: string) {
    if (!profile) return;
    const walletAddr = useUserStore.getState().walletAddress;
    if (!walletAddr) return;

    try {
      const res = await fetch("/api/escrow/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerWallet: walletAddr,
          stakeAmount,
          matchContentId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const winnings = (stakeAmount * 2 * 0.95).toFixed(3);
        toast.success(`Winnings deposited! +${winnings} SOL`, {
          description: `TX: ${data.txSignature?.slice(0, 12)}...`,
        });
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error("Failed to claim winnings: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Payout claim error:", err);
      toast.error("Failed to claim winnings");
    }
  }

  function handleStartFromSetup() {
    setShowSetup(false);
    startCountdown();
  }

  function handleMultiplayerStart(channel: RealtimeChannel) {
    mpChannelRef.current = channel;
    didBroadcastFinish.current = false;

    // Re-subscribe to events for the game phase
    channel.on("broadcast", { event: "room_event" }, ({ payload }) => {
      const evt = payload as { type: string; payload: ProgressPayload | { playerId: string } };
      if (evt.type === "progress") {
        const data = evt.payload as ProgressPayload;
        const store = useGameStore.getState();
        // Allow progress updates even during countdown so opponent data is fresh
        if (store.gameState === "racing" || store.gameState === "countdown") {
          // Update opponent state directly without the racing-only guard
          const updatedOpponent = { ...store.opponent };
          updatedOpponent.progress = data.progress;
          updatedOpponent.wpm = data.wpm;
          updatedOpponent.speed = data.wpm;
          updatedOpponent.accuracy = data.accuracy;
          updatedOpponent.correctHits = data.correctHits;
          updatedOpponent.totalHits = data.totalHits;
          updatedOpponent.streak = data.streak;
          updatedOpponent.isFinished = data.isFinished;
          updatedOpponent.username = data.username;
          useGameStore.setState({ opponent: updatedOpponent });
        }
      }
      if (evt.type === "player_finished") {
        const store = useGameStore.getState();
        if (store.gameState === "racing" || store.gameState === "countdown") {
          // Mark opponent as finished before ending the game
          const updatedOpponent = { ...store.opponent, isFinished: true, progress: 100 };
          useGameStore.setState({ opponent: updatedOpponent });
          store.endGame();
        }
      }
      if (evt.type === "player_left") {
        const store = useGameStore.getState();
        if (store.gameState === "racing" || store.gameState === "countdown") {
          toast.success("Opponent disconnected — you win!");
          store.endGame();
        }
      }
    });

    setShowSetup(false);
    startCountdown();
  }

  function handlePlayAgain() {
    cleanupChannel();
    mpChannelRef.current = null;
    didBroadcastFinish.current = false;
    didRecordMatch.current = false;
    resetGame();
    setShowSetup(true);
    setLastResult(null);
  }

  function handleShare() {
    if (!matchResult) return;
    const modeLabel = matchMode === "multiplayer" ? "multiplayer" : "bot";
    const text = `I just ${
      matchResult.winnerId === player.id ? "won" : "lost"
    } a KeySocial ${modeLabel} race! WPM: ${player.wpm} | Accuracy: ${player.accuracy}% 🏎️⚡ #KeySocial #Solana`;

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
          <GameSetup
            onStart={handleStartFromSetup}
            onMultiplayerStart={handleMultiplayerStart}
            initialDifficulty={initialDifficulty}
            initialMode={initialMode}
            initialRoomCode={initialRoomCode}
            initialStake={initialStake}
          />
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
  const isMultiplayer = matchMode === "multiplayer";

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
              {isMultiplayer ? (
                <>1v1 Race <span className="text-accent-blue text-lg font-normal ml-2">Multiplayer</span></>
              ) : (
                <>Heat #{String(startTime || Date.now()).slice(-4)}{" "}
                <span className="text-gray-400 dark:text-gray-500 text-lg font-normal ml-2">
                  Standard • {config.trackLength} Words
                </span></>
              )}
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
              colorClass={isMultiplayer ? "from-blue-500 to-indigo-600" : "from-purple-500 to-indigo-600"}
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
                  {isMultiplayer ? (
                    <>Mode: <span className="font-mono">1v1 Multiplayer</span></>
                  ) : (
                    <>Stake: <span className="font-mono">{stakeAmount ? `${stakeAmount} SOL` : "Practice"}</span></>
                  )}
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
            charStates={player.charStates}
            awaitingSpace={player.awaitingSpace}
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
