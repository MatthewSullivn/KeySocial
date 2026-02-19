"use client";

import type { MatchResult, PlayerState } from "@/lib/game-engine";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GameResultsProps {
  result: MatchResult;
  player: PlayerState;
  opponent: PlayerState;
  isPlayerWinner: boolean;
  onPlayAgain: () => void;
  onShare: () => void;
}

export default function GameResults({
  result,
  player,
  opponent,
  isPlayerWinner,
  onPlayAgain,
  onShare,
}: GameResultsProps) {
  return (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Result Banner */}
      <div
        className={cn(
          "text-center mb-8 p-8 rounded-3xl border",
          isPlayerWinner
            ? "bg-purple-500/10 border-purple-500/25"
            : "bg-red-500/10 border-red-500/20"
        )}
      >
        <div className="mb-4">
          {isPlayerWinner ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-purple-500/20 border-2 border-purple-500/40">
              <span className="material-icons text-5xl text-purple-400">emoji_events</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/15 border-2 border-red-500/30">
              <span className="material-icons text-5xl text-red-400">speed</span>
            </div>
          )}
        </div>

        <h2
          className={cn(
            "text-3xl sm:text-4xl font-black mb-2",
            isPlayerWinner ? "text-purple-400" : "text-red-400"
          )}
        >
          {isPlayerWinner ? "VICTORY!" : "DEFEATED"}
        </h2>
        <p className="text-gray-400">
          {isPlayerWinner
            ? "You crossed the finish line first!"
            : `${result.winnerUsername} was faster this time.`}
        </p>
      </div>

      {/* Stats Comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6 bg-bg-card rounded-2xl border border-purple-500/10 p-6">
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">You</div>
          <div className="text-2xl font-black text-purple-400">{player.wpm}</div>
          <div className="text-xs text-gray-500">WPM</div>
        </div>
        <div className="flex items-center justify-center">
          <span className="material-icons text-purple-500 text-2xl">bolt</span>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">{opponent.username}</div>
          <div className="text-2xl font-black text-pink-400">{opponent.wpm}</div>
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
            "text-center p-5 rounded-2xl border mb-8",
            isPlayerWinner
              ? "bg-purple-500/10 border-purple-500/25"
              : "bg-red-500/10 border-red-500/20"
          )}
        >
          <div className="text-sm text-gray-400 mb-1">
            {isPlayerWinner ? "You won" : "You lost"}
          </div>
          <div
            className={cn(
              "text-2xl font-black",
              isPlayerWinner ? "text-accent-green" : "text-accent-red"
            )}
          >
            {isPlayerWinner ? "+" : "-"}{result.stakeAmount} SOL
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold transition-all hover:-translate-y-0.5 shadow-glow-sm"
        >
          <span className="material-icons text-xl">replay</span>
          Race Again
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-purple-500/20 text-gray-300 font-medium hover:bg-bg-elevated transition-all"
        >
          <span className="material-icons text-xl">share</span>
          Share Result
        </button>
        <Link
          href="/leaderboard"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-purple-500/20 text-gray-300 font-medium hover:bg-bg-elevated transition-all"
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
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-card border border-purple-500/10">
      <span className="material-icons-outlined text-gray-500">{icon}</span>
      <div>
        <div className="text-sm font-bold">{value}</div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
