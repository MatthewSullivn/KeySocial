"use client";

import type { PlayerState, GameConfig } from "@/lib/game-engine";
import { Timer, Zap, Target, Flame, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameHUDProps {
  player: PlayerState;
  timeElapsed: number;
  config: GameConfig;
  stakeAmount: number;
}

export default function GameHUD({
  player,
  timeElapsed,
  config,
  stakeAmount,
}: GameHUDProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <HUDItem
        icon={<Timer className="w-4 h-4" />}
        label="Time"
        value={formatTime(timeElapsed)}
        color="blue"
      />
      <HUDItem
        icon={<Zap className="w-4 h-4" />}
        label="WPM"
        value={String(player.wpm)}
        color="green"
      />
      <HUDItem
        icon={<Target className="w-4 h-4" />}
        label="Accuracy"
        value={`${player.accuracy}%`}
        color={player.accuracy >= 90 ? "green" : player.accuracy >= 70 ? "yellow" : "red"}
      />
      <HUDItem
        icon={<Flame className="w-4 h-4" />}
        label="Streak"
        value={String(player.streak)}
        color={player.streak >= 10 ? "green" : player.streak >= 5 ? "yellow" : "default"}
      />
      <HUDItem
        icon={<Keyboard className="w-4 h-4" />}
        label="Words"
        value={`${player.streak}/${config.trackLength}`}
        color="purple"
      />
    </div>
  );
}

function HUDItem({
  icon,
  label,
  value,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-neon-green",
    blue: "text-neon-blue",
    purple: "text-neon-purple",
    yellow: "text-neon-yellow",
    red: "text-neon-pink",
    default: "text-slate-300",
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-600/30">
      <div className="text-slate-500">{icon}</div>
      <div>
        <div className={cn("text-lg font-bold font-mono", colorMap[color] || colorMap.default)}>
          {value}
        </div>
        <div className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
