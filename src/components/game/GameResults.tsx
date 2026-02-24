"use client";

import { useEffect, useState } from "react";
import type { MatchResult, PlayerState } from "@/lib/game-engine";
import { Connection } from "@solana/web3.js";
import Link from "next/link";
import { useNetwork } from "@/providers/NetworkProvider";
import { cn } from "@/lib/utils";

interface GameResultsProps {
  result: MatchResult;
  player: PlayerState;
  opponent: PlayerState;
  isPlayerWinner: boolean;
  depositTxSignatures?: string[];
  payoutTxSignature?: string | null;
  refundTxSignatures?: string[];
  onPlayAgain: () => void;
  onShare: () => void;
}

export default function GameResults({
  result,
  player,
  opponent,
  isPlayerWinner,
  depositTxSignatures = [],
  payoutTxSignature,
  refundTxSignatures = [],
  onPlayAgain,
  onShare,
}: GameResultsProps) {
  const { solscanSuffix, networkLabel, rpcUrl } = useNetwork();
  const uniqueDepositSigs = Array.from(new Set(depositTxSignatures.filter(Boolean)));
  const uniqueRefundSigs = Array.from(new Set(refundTxSignatures.filter(Boolean)));
  const winnerPayoutSOL =
    result.stakeAmount > 0 ? Number((result.stakeAmount * 2).toFixed(3)) : 0;
  return (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Result Banner */}
      <div
        className={cn(
          "text-center mb-8 p-8 rounded-xl border",
          isPlayerWinner
            ? "bg-purple-50 border-purple-200"
            : "bg-red-50 border-red-200"
        )}
      >
        <div className="mb-4">
          {isPlayerWinner ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-100 border-2 border-purple-300">
              <span className="material-icons text-5xl text-purple-500">emoji_events</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 border-2 border-red-200">
              <span className="material-icons text-5xl text-red-500">speed</span>
            </div>
          )}
        </div>

        <h2
          className={cn(
            "text-3xl sm:text-4xl font-black mb-2",
            isPlayerWinner ? "text-purple-600" : "text-red-500"
          )}
        >
          {isPlayerWinner ? "VICTORY!" : "DEFEATED"}
        </h2>
        <p className="text-gray-500">
          {isPlayerWinner
            ? "You crossed the finish line first!"
            : `${result.winnerUsername} was faster this time.`}
        </p>
      </div>

      {/* Stats Comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6 bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">You</div>
          <div className="text-2xl font-black text-purple-600">{player.wpm}</div>
          <div className="text-xs text-gray-500">WPM</div>
        </div>
        <div className="flex items-center justify-center">
          <span className="material-icons text-purple-500 text-2xl">bolt</span>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 mb-1">{opponent.username}</div>
          <div className="text-2xl font-black text-pink-500">{opponent.wpm}</div>
          <div className="text-xs text-gray-500">WPM</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <StatRow label="Accuracy" value={`${player.accuracy}%`} icon="gps_fixed" />
        <StatRow label="Best Streak" value={String(player.bestStreak)} icon="local_fire_department" />
        <StatRow label="Mistakes" value={String(player.mistakes)} icon="close" />
        <StatRow label="Duration" value={`${Math.round(result.duration)}s`} icon="timer" />
      </div>

      {/* Stake result */}
      {result.stakeAmount > 0 && (
        <div
          className={cn(
            "text-center p-5 rounded-xl border mb-8",
            isPlayerWinner
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}
        >
          <div className="text-sm text-gray-500 mb-1">
            {isPlayerWinner ? "You won" : "You lost"}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span
              className={cn(
                "text-2xl font-black",
                isPlayerWinner ? "text-green-600" : "text-red-500"
              )}
            >
              {isPlayerWinner ? "+" : "-"}{result.stakeAmount} SOL
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              {networkLabel}
            </span>
          </div>
          {payoutTxSignature && (
            <a
              href={`https://solscan.io/tx/${payoutTxSignature}${solscanSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <span className="material-icons text-sm">open_in_new</span>
              View Payout TX on Solscan
            </a>
          )}
        </div>
      )}

      {result.stakeAmount > 0 && (uniqueDepositSigs.length > 0 || !!payoutTxSignature || uniqueRefundSigs.length > 0) && (
        <div className="mb-8 bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
            Transaction History ({uniqueDepositSigs.length + (payoutTxSignature ? 1 : 0) + uniqueRefundSigs.length})
          </div>
          <div className="space-y-2">
            {uniqueDepositSigs.map((sig, idx) => {
              const label = `Stake Deposit ${idx + 1} (${result.stakeAmount} SOL)`;
              return (
                <a
                  key={`${sig}-${idx}`}
                  href={`https://solscan.io/tx/${sig}${solscanSuffix}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700 flex flex-col">
                    <span className="font-semibold text-gray-500 mr-1">{label}:</span>
                    <span className="font-mono">{sig.slice(0, 10)}...</span>
                    <TxTimestamp sig={sig} rpcUrl={rpcUrl} />
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                    View
                    <span className="material-icons text-sm">open_in_new</span>
                  </span>
                </a>
              );
            })}
            {payoutTxSignature && (
              <a
                href={`https://solscan.io/tx/${payoutTxSignature}${solscanSuffix}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm hover:bg-green-100/70 transition-colors"
              >
                <span className="text-gray-700 flex flex-col">
                  <span className="font-semibold text-green-700 mr-1">
                    Winner Payout ({winnerPayoutSOL} SOL):
                  </span>
                  <span className="font-mono">{payoutTxSignature.slice(0, 10)}...</span>
                  <TxTimestamp sig={payoutTxSignature} rpcUrl={rpcUrl} />
                </span>
                <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                  View
                  <span className="material-icons text-sm">open_in_new</span>
                </span>
              </a>
            )}
            {uniqueRefundSigs.map((sig, idx) => (
              <a
                key={`refund-${sig}-${idx}`}
                href={`https://solscan.io/tx/${sig}${solscanSuffix}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm hover:bg-orange-100/70 transition-colors"
              >
                <span className="text-gray-700 flex flex-col">
                  <span className="font-semibold text-orange-700 mr-1">
                    Refund {uniqueRefundSigs.length > 1 ? `${idx + 1}` : ""}:
                  </span>
                  <span className="font-mono">{sig.slice(0, 10)}...</span>
                  <TxTimestamp sig={sig} rpcUrl={rpcUrl} />
                </span>
                <span className="inline-flex items-center gap-1 text-orange-700 font-medium">
                  View
                  <span className="material-icons text-sm">open_in_new</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-purple-500 text-white font-bold transition-all hover:bg-purple-600 hover:-translate-y-0.5"
        >
          <span className="material-icons text-xl">replay</span>
          Race Again
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
        >
          <span className="material-icons text-xl">share</span>
          Share Result
        </button>
        <Link
          href="/leaderboard"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
        >
          <span className="material-icons text-xl">emoji_events</span>
          Leaderboard
          <span className="material-icons text-lg">chevron_right</span>
        </Link>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-200">
      <span className="material-icons-outlined text-gray-400">{icon}</span>
      <div>
        <div className="text-sm font-bold text-gray-900">{value}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function TxTimestamp({ sig, rpcUrl }: { sig: string; rpcUrl: string }) {
  const [text, setText] = useState<string>("Loading time...");

  useEffect(() => {
    let cancelled = false;
    const connection = new Connection(rpcUrl, "confirmed");

    async function load() {
      try {
        const statusRes = await connection.getSignatureStatuses([sig], {
          searchTransactionHistory: true,
        });
        const slot = statusRes.value[0]?.slot;
        if (!slot) {
          if (!cancelled) setText("Time unavailable");
          return;
        }
        const blockTime = await connection.getBlockTime(slot);
        if (!blockTime) {
          if (!cancelled) setText("Time unavailable");
          return;
        }
        if (!cancelled) {
          const dt = new Date(blockTime * 1000);
          setText(
            `${dt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} · ${dt.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}`
          );
        }
      } catch {
        if (!cancelled) setText("Time unavailable");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sig, rpcUrl]);

  return <span className="text-[10px] text-gray-400 mt-0.5">{text}</span>;
}
