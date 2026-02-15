"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useUserStore } from "@/store/user-store";
import { useGameStore } from "@/store/game-store";
import { DIFFICULTY_CONFIGS } from "@/lib/game-engine";
import { cn } from "@/lib/utils";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

interface GameSetupProps {
  onStart: () => void;
  initialDifficulty?: string;
}

const difficulties = [
  {
    id: "easy",
    label: "Casual",
    icon: "sports_esports",
    desc: "Short words",
    ring: "ring-primary/60",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  {
    id: "medium",
    label: "Ranked",
    icon: "local_fire_department",
    desc: "Medium words",
    ring: "ring-secondary/60",
    bg: "bg-secondary/10",
    text: "text-secondary",
  },
  {
    id: "hard",
    label: "Elite",
    icon: "bolt",
    desc: "Long words",
    ring: "ring-accent-purple/60",
    bg: "bg-accent-purple/10",
    text: "text-accent-purple",
  },
  {
    id: "insane",
    label: "Insane",
    icon: "skull",
    desc: "Very long words",
    ring: "ring-accent-pink/60",
    bg: "bg-accent-pink/10",
    text: "text-accent-pink",
  },
];

const stakeOptions = [0, 0.01, 0.05, 0.1, 0.25, 0.5];

export default function GameSetup({ onStart, initialDifficulty }: GameSetupProps) {
  const { connected } = useWallet();
  const { profile, walletAddress } = useUserStore();
  const { initGame } = useGameStore();

  const validDiffs = ["easy", "medium", "hard", "insane"];
  const [difficulty, setDifficulty] = useState(
    initialDifficulty && validDiffs.includes(initialDifficulty) ? initialDifficulty : "medium"
  );
  const [stakeAmount, setStakeAmount] = useState(0);

  function handleStart() {
    const playerId = profile?.id || profile?.username || walletAddress || "guest";
    const playerUsername = profile?.username || "Player";
    initGame(playerId, playerUsername, difficulty, stakeAmount > 0 ? "ranked" : "practice", stakeAmount);
    onStart();
  }

  if (!connected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
          <span className="material-icons text-4xl text-primary">speed</span>
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Connect to Race</h2>
        <p className="text-muted-light dark:text-muted-dark mb-8">
          Connect your Solana wallet to start racing and earn rewards.
        </p>
        <WalletMultiButton className="!bg-black hover:!bg-gray-800 !text-white dark:!bg-white dark:!text-black dark:hover:!bg-gray-200 !px-6 !py-3 !rounded-full !text-sm !font-bold !shadow-lg" />
      </div>
    );
  }

  const currentConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 flex items-center justify-center gap-2">
          <span className="material-icons text-primary text-3xl">bolt</span>
          Race Setup
        </h1>
        <p className="text-muted-light dark:text-muted-dark">Choose your difficulty and stake amount</p>
      </div>

      {/* Difficulty Selection */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-light dark:text-muted-dark mb-3">
          Difficulty
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={cn(
                "p-4 rounded-2xl border-2 text-center transition-all hover:scale-[1.02]",
                difficulty === d.id
                  ? `${d.bg} ${d.ring} ring-2 border-transparent`
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <span className={cn("material-icons text-2xl mb-2 block", d.text)}>{d.icon}</span>
              <div className="font-bold text-sm">{d.label}</div>
              <div className="text-xs text-muted-light dark:text-muted-dark mt-1">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Game Config Preview */}
      <div className="mb-8 bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-primary">
            {currentConfig?.trackLength ?? "–"}
          </div>
          <div className="text-xs text-muted-light dark:text-muted-dark font-medium mt-1">Words to finish the race</div>
        </div>
      </div>

      {/* Stake Amount */}
      <div className="mb-10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-light dark:text-muted-dark mb-3">
          Stake Amount (SOL)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {stakeOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setStakeAmount(amount)}
              className={cn(
                "px-4 py-3 rounded-xl font-mono text-sm font-bold transition-all border",
                stakeAmount === amount
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(212,232,98,0.3)]"
                  : "border-gray-200 dark:border-gray-700 text-muted-light dark:text-muted-dark hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {amount === 0 ? "Free" : `${amount}`}
            </button>
          ))}
        </div>
        {stakeAmount > 0 && (
          <p className="text-xs text-muted-light dark:text-muted-dark mt-2">
            Both players stake {stakeAmount} SOL. Winner takes all.
          </p>
        )}
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="w-full py-4 rounded-xl bg-primary hover:bg-[#B8D43B] text-black font-extrabold text-lg shadow-lg hover:shadow-[0_0_15px_rgba(212,232,98,0.5)] transition-all hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <span className="material-icons">swords</span>
        {stakeAmount > 0 ? `Stake ${stakeAmount} SOL & Race` : "Start Practice Race"}
      </button>
    </div>
  );
}
