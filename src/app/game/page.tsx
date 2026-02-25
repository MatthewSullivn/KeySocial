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
import { cn } from "@/lib/utils";
import { useNetwork } from "@/providers/NetworkProvider";
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
    depositTxSignatures,
    startCountdown,
    handleKeyPress,
    updateOpponent,
    tick,
    resetGame,
  } = useGameStore();

  const { profile } = useUserStore();
  const { solscanSuffix, networkLabel } = useNetwork();

  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [payoutTxSig, setPayoutTxSig] = useState<string | null>(null);
  const [refundTxSigs, setRefundTxSigs] = useState<string[]>([]);
  const payoutTxSigRef = useRef<string | null>(null);
  const refundTxSigsRef = useRef<string[]>([]);

  const didResetOnMount = useRef(false);
  useEffect(() => {
    payoutTxSigRef.current = payoutTxSig;
  }, [payoutTxSig]);
  useEffect(() => {
    refundTxSigsRef.current = refundTxSigs;
  }, [refundTxSigs]);

  function addRefundTxSig(sig?: string | null) {
    if (!sig) return;
    setRefundTxSigs((prev) => (prev.includes(sig) ? prev : [...prev, sig]));
  }

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

  const didBroadcastFinish = useRef(false);
  useEffect(() => {
    if (matchMode !== "multiplayer") return;
    if (!player.isFinished || didBroadcastFinish.current) return;
    const channel = mpChannelRef.current;
    if (!channel) return;

    didBroadcastFinish.current = true;
    broadcastFinished(channel, player.id);

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

  const didRecordMatch = useRef(false);
  useEffect(() => {
    if (gameState === "finished" && matchResult && !didRecordMatch.current) {
      didRecordMatch.current = true;
      setPayoutTxSig(null);
      setRefundTxSigs([]);
      recordMatchOnChain();
    }

    if (gameState === "finished" && matchMode === "multiplayer") {
      // Keep the room alive longer for staked matches so both players
      // can receive payout/refund broadcast confirmations.
      const cleanupDelayMs = stakeAmount > 0 ? 20_000 : 5_000;
      setTimeout(() => {
        cleanupChannel();
        mpChannelRef.current = null;
      }, cleanupDelayMs);
    }
  }, [gameState, matchResult, matchMode, stakeAmount]);

  async function claimPayout(): Promise<string | null> {
    const walletAddr = useUserStore.getState().walletAddress;
    if (!walletAddr) return null;

    async function attemptSafetyRefund(reason: string): Promise<void> {
      if (stakeAmount <= 0) return;
      try {
        const refundRes = await fetch("/api/escrow/refund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: walletAddr,
            amount: stakeAmount,
            network: "devnet",
          }),
        });
        const refundData = await refundRes.json().catch(() => ({}));
        if (refundRes.ok && refundData.txSignature) {
          addRefundTxSig(refundData.txSignature);
          if (mpChannelRef.current) {
            mpChannelRef.current.send({
              type: "broadcast",
              event: "room_event",
              payload: {
                type: "refund_confirmed",
                payload: {
                  txSignature: refundData.txSignature,
                  walletAddress: walletAddr,
                  amountSOL: stakeAmount,
                },
              },
            });
          }
          toast.warning(`Payout failed (${reason}). Safety refund sent: ${stakeAmount} SOL`, {
            description: `TX: ${refundData.txSignature.slice(0, 16)}...`,
            duration: 12000,
            action: {
              label: "View TX",
              onClick: () =>
                window.open(`https://solscan.io/tx/${refundData.txSignature}${solscanSuffix}`, "_blank"),
            },
          });
        } else if (refundRes.status === 409) {
          toast.warning(`Payout failed (${reason}). Refund already requested.`);
        } else {
          toast.error(
            `Payout failed (${reason}) and safety refund failed: ${
              refundData.error || "Unknown error"
            }`
          );
        }
      } catch (refundErr) {
        console.error("Safety refund error:", refundErr);
        toast.error(`Payout failed (${reason}) and safety refund request failed.`);
      }
    }

    function getPayoutStorageKey(): string {
      const dep = depositTxSignatures?.[0];
      const fp = dep || `payout-${player.id}-${opponent.id}-${stakeAmount}-${startTime}`;
      return `keysocial-payout-${fp}`;
    }

    try {
      const storageKey = getPayoutStorageKey();
      const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(storageKey) : null;
      if (stored) {
        try {
          const { txSignature: cachedSig } = JSON.parse(stored);
          if (cachedSig) {
            setPayoutTxSig(cachedSig);
            return cachedSig;
          }
        } catch {
          /* ignore */
        }
      }

      const idempotencyKey = crypto.randomUUID();
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(storageKey, JSON.stringify({ idempotencyKey }));
      }

      const PAYOUT_MAX_RETRIES = 3;
      const PAYOUT_RETRY_DELAY_MS = 4000;
      let lastError = "";

      for (let attempt = 0; attempt < PAYOUT_MAX_RETRIES; attempt++) {
        try {
          const res = await fetch("/api/escrow/payout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              winnerWallet: walletAddr,
              stakeAmount,
              matchContentId: "pending",
              idempotencyKey,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const winnings = (stakeAmount * 2).toFixed(3);
            const sig = data.txSignature || null;
            setPayoutTxSig(sig);
            if (sig && typeof sessionStorage !== "undefined") {
              sessionStorage.setItem(
                getPayoutStorageKey(),
                JSON.stringify({ txSignature: sig, idempotencyKey })
              );
            }
            if (sig && mpChannelRef.current) {
              mpChannelRef.current.send({
                type: "broadcast",
                event: "room_event",
                payload: {
                  type: "payout_confirmed",
                  payload: {
                    txSignature: sig,
                    winnerId: player.id,
                    winnerUsername: player.username,
                    payoutSOL: Number(winnings),
                  },
                },
              });
            }
            toast.success(`Winnings deposited! +${winnings} SOL`, {
              description: sig ? `TX: ${sig.slice(0, 16)}...` : undefined,
              action: sig ? {
                label: "View TX",
                onClick: () => window.open(`https://solscan.io/tx/${sig}${solscanSuffix}`, "_blank"),
              } : undefined,
            });
            return sig;
          } else {
            const text = await res.text();
            let err: { error?: string; details?: string };
            try {
              err = JSON.parse(text);
            } catch {
              err = { error: "Server error", details: text.slice(0, 200) || `${res.status} ${res.statusText}` };
            }
            lastError = err.details || err.error || "Unknown error";

            // Retry on 402 (insufficient balance — deposits may still be confirming)
            // or 5xx server errors
            if ((res.status === 402 || res.status >= 500) && attempt < PAYOUT_MAX_RETRIES - 1) {
              console.log(`Payout attempt ${attempt + 1} failed (${res.status}): ${lastError}, retrying...`);
              await new Promise((r) => setTimeout(r, PAYOUT_RETRY_DELAY_MS));
              continue;
            }
          }
        } catch (fetchErr) {
          lastError = fetchErr instanceof Error ? fetchErr.message : "Request failed";
          if (attempt < PAYOUT_MAX_RETRIES - 1) {
            console.log(`Payout attempt ${attempt + 1} network error: ${lastError}, retrying...`);
            await new Promise((r) => setTimeout(r, PAYOUT_RETRY_DELAY_MS));
            continue;
          }
        }
        // If we reach here on last attempt, break out
        break;
      }

      // All retries exhausted — attempt safety refund
      toast.error("Failed to claim winnings: " + lastError);
      await attemptSafetyRefund(lastError);
    } catch (err) {
      console.error("Payout claim error:", err);
      const reason = err instanceof Error ? err.message : "Request failed";
      toast.error("Failed to claim winnings: " + reason);
      await attemptSafetyRefund(reason);
    }
    return null;
  }

  async function waitForPayoutSignature(timeoutMs = 12000): Promise<string | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (payoutTxSigRef.current) return payoutTxSigRef.current;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return payoutTxSigRef.current;
  }

  async function waitForRefundSignatures(timeoutMs = 12000): Promise<string[]> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (refundTxSigsRef.current.length > 0) return refundTxSigsRef.current;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return refundTxSigsRef.current;
  }

  async function recordMatchOnChain() {
    if (!matchResult) return;
    const isWinner = matchResult.winnerId === player.id;
    const fp = depositTxSignatures?.[0] || `match-${player.id}-${opponent.id}-${stakeAmount}-${startTime}`;
    const recordedKey = `keysocial-recorded-${fp}`;

    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(recordedKey)) {
        if (stakeAmount > 0 && isWinner) {
          const payoutFp = depositTxSignatures?.[0] || `payout-${player.id}-${opponent.id}-${stakeAmount}-${startTime}`;
          const payoutStored = sessionStorage.getItem(`keysocial-payout-${payoutFp}`);
          if (payoutStored) {
            try {
              const { txSignature } = JSON.parse(payoutStored);
              if (txSignature) setPayoutTxSig(txSignature);
            } catch {
              /* ignore */
            }
          }
        }
        return;
      }
      sessionStorage.setItem(recordedKey, "1");
    }

    if (matchMode === "multiplayer" && stakeAmount > 0 && !isWinner) {
      toast.error("Better luck next time! Your stake has been lost.");
    }

    // Step 1: Attempt payout (isolated so failures don't block match recording)
    let payoutTxSignature: string | undefined;
    try {
      if (stakeAmount > 0 && isWinner) {
        const sig = await claimPayout();
        if (sig) payoutTxSignature = sig;
      }
      if (stakeAmount > 0 && !isWinner) {
        // Loser fallback record waits briefly for winner payout broadcast
        // so profile match history can include payout TX consistently.
        const sig = await waitForPayoutSignature();
        if (sig) payoutTxSignature = sig;
        await waitForRefundSignatures();
      }
    } catch (payoutErr) {
      console.error("Payout phase error (match recording will continue):", payoutErr);
    }

    // Step 2: Record match on-chain (always runs regardless of payout outcome)
    try {
      let authorProfile = profile;
      if (!authorProfile) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 300));
          authorProfile = useUserStore.getState().profile;
          if (authorProfile) break;
        }
      }
      if (!authorProfile) {
        toast.info("Winnings processed. Create a profile to publish match history onchain.");
        return;
      }

      await recordMatchResult(authorProfile.id || authorProfile.username, {
        ...matchResult,
        matchType: stakeAmount > 0 ? "ranked" : "practice",
        stakeAmount,
        network: "devnet",
        payoutTxSignature,
        depositTxSignatures,
        refundTxSignatures: refundTxSigsRef.current,
      });
      toast.success("Match recorded onchain!");
    } catch (err) {
      console.error("Failed to record match:", err);
      toast.error("Could not save match to profile. Please try again.");
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem(recordedKey);
      }
    }
  }

  function handleStartFromSetup() {
    setShowSetup(false);
    startCountdown();
  }

  function handleMultiplayerStart(channel: RealtimeChannel) {
    mpChannelRef.current = channel;
    didBroadcastFinish.current = false;

    channel.on("broadcast", { event: "room_event" }, ({ payload }) => {
      const evt = payload as {
        type: string;
        payload:
          | ProgressPayload
          | { playerId: string }
          | {
              txSignature: string;
              winnerId: string;
              winnerUsername: string;
              payoutSOL?: number;
            }
          | {
              txSignature: string;
              walletAddress?: string;
              amountSOL?: number;
            };
      };
      if (evt.type === "progress") {
        const data = evt.payload as ProgressPayload;
        const store = useGameStore.getState();
        if (store.gameState === "racing" || store.gameState === "countdown") {
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
      if (evt.type === "payout_confirmed") {
        const data = evt.payload as {
          txSignature: string;
          winnerId: string;
          winnerUsername: string;
          payoutSOL?: number;
        };
        if (data.txSignature) {
          setPayoutTxSig((prev) => prev || data.txSignature);
          const isMeWinner = data.winnerId === useGameStore.getState().player.id;
          if (!isMeWinner) {
            toast.success(
              `${data.winnerUsername || "Winner"} received ${
                data.payoutSOL ? `${data.payoutSOL} SOL` : "winnings"
              }`,
              {
                description: `TX: ${data.txSignature.slice(0, 16)}...`,
                duration: 10000,
                action: {
                  label: "View TX",
                  onClick: () =>
                    window.open(`https://solscan.io/tx/${data.txSignature}${solscanSuffix}`, "_blank"),
                },
              }
            );
          }
        }
      }
      if (evt.type === "refund_confirmed") {
        const data = evt.payload as {
          txSignature: string;
          walletAddress?: string;
          amountSOL?: number;
        };
        if (data.txSignature) {
          addRefundTxSig(data.txSignature);
          toast.warning(`Refund processed${data.amountSOL ? ` (${data.amountSOL} SOL)` : ""}`, {
            description: `TX: ${data.txSignature.slice(0, 16)}...`,
            duration: 10000,
            action: {
              label: "View TX",
              onClick: () =>
                window.open(`https://solscan.io/tx/${data.txSignature}${solscanSuffix}`, "_blank"),
            },
          });
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
    setPayoutTxSig(null);
    setRefundTxSigs([]);
  }

  function handleShare() {
    if (!matchResult) return;
    const won = matchResult.winnerId === player.id;
    const oppName = opponent.username || "opponent";
    const duration = timeElapsed > 0 ? `${Math.floor(timeElapsed / 60)}m ${timeElapsed % 60}s` : "";
    const stakeInfo = stakeAmount > 0 ? ` | Stake: ${stakeAmount} SOL` : "";
    const durationInfo = duration ? ` | Duration: ${duration}` : "";

    const text = `I just ${won ? "beat" : "lost to"} @${oppName} in a KeySocial typing race!\n\nWPM: ${player.wpm} vs ${opponent.wpm} | Accuracy: ${player.accuracy}%${durationInfo}${stakeInfo}\n\n#KeySocial #Solana #Tapestry`;

    if (navigator.share) {
      navigator.share({ title: "KeySocial Race Result", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Result copied to clipboard!");
    }
  }

  if (showSetup && gameState === "idle") {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        <AppHeader />
        <main className="flex-grow flex flex-col items-center justify-center px-4">
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

  if (gameState === "finished") {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        <AppHeader />
        <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
          {matchResult && (
            <GameResults
              result={matchResult}
              player={player}
              opponent={opponent}
              isPlayerWinner={matchResult.winnerId === player.id}
              depositTxSignatures={depositTxSignatures}
              payoutTxSignature={payoutTxSig}
              refundTxSignatures={refundTxSigs}
              onPlayAgain={handlePlayAgain}
              onShare={handleShare}
            />
          )}
        </main>
      </div>
    );
  }

  const isMultiplayer = matchMode === "multiplayer";

  return (
    <div className="min-h-screen bg-background text-text flex flex-col relative">
      {/* Subtle background radial gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-200/20 rounded-full blur-[120px]" />
      </div>

      <CountdownOverlay count={countdown} show={gameState === "countdown"} />
      <AppHeader />

      <main className="flex-grow flex flex-col items-center justify-center relative p-4 md:p-8 overflow-hidden z-10">
        <div className="w-full max-w-5xl mb-8 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isMultiplayer ? (
                <>1v1 Race <span className="text-purple-500 text-lg font-normal ml-2">Multiplayer</span></>
              ) : (
                <>Heat #{String(startTime || Date.now()).slice(-4)}{" "}
                <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-500 font-normal">
                  STANDARD
                </span>
                <span className="text-gray-400 text-base font-normal ml-2">
                  {config.trackLength} Words • English
                </span></>
              )}
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-purple-500">
              <span className="material-icons text-base">timer</span>
              {formatClock(timeElapsed)}
            </div>
          </div>

          <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
            <ProgressRow
              label={`@${opponent.username || "opponent"}`}
              percent={Math.round(opponent.progress)}
              colorClass="from-pink-400 to-pink-500"
              badge="2nd"
            />
            <ProgressRow
              label={`@${player.username || "you"}`}
              percent={Math.round(player.progress)}
              colorClass="from-purple-500 to-purple-600"
              badge="1st"
              glow
            />

            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-2">
                <span className="material-icons text-base text-purple-500">bolt</span>
                <span>
                  {isMultiplayer ? (
                    <>Mode: <span className="font-mono">1v1 Multiplayer</span></>
                  ) : (
                    <>Stake: <span className="font-mono">{stakeAmount ? `${stakeAmount} SOL` : "Practice"}</span></>
                  )}
                </span>
              </div>
              <div className="font-mono">
                WPM: <span className="font-bold text-gray-900">{player.wpm}</span> &bull; ACC:{" "}
                <span className="font-bold text-gray-900">{player.accuracy}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl bg-gray-50 rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-50 border border-purple-200 rounded-md text-xs text-purple-600 font-bold">
              STAKE: {stakeAmount ? `${stakeAmount} SOL` : "PRACTICE"}
            </span>
          </div>
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
          <div className="mt-4 flex justify-between items-center text-xs text-gray-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              {networkLabel}
            </div>
            <div className="flex items-center gap-4">
              <span>Words: {player.streak}/{config.trackLength}</span>
              <span>Errors: {player.mistakes}</span>
            </div>
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
      <div className="flex justify-between text-xs font-semibold mb-1 text-gray-500">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full relative ${
            glow ? "shadow-[0_0_12px_rgba(139,92,246,0.3)]" : ""
          }`}
          style={{ width: `${percent}%` }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-80 animate-pulse"></div>
        </div>
      </div>
      <div className="absolute -right-3 -top-3 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md z-10 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
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
