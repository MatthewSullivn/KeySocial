"use client";

import { useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

export default function MatchLobbyPage() {
  const [stake, setStake] = useState(1.0);
  const potentialWin = Math.max(0, stake * 2 * 0.95);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans min-h-screen flex flex-col transition-colors duration-300">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <svg
          className="absolute -top-20 -left-20 w-96 h-96 text-primary opacity-40 dark:opacity-20 animate-pulse"
          style={{ animationDuration: "8s" }}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.2C59,40.9,47.1,47.4,35.7,55.1C24.3,62.8,13.4,71.7,0.7,70.5C-12,69.3,-22.9,58,-35.1,50.8C-47.3,43.6,-60.8,40.5,-69.5,31.7C-78.2,22.9,-82.1,8.4,-78.7,-4.3C-75.3,-17,-64.6,-27.9,-53.6,-36.5C-42.6,-45.1,-31.3,-51.4,-19.6,-56.9C-7.9,-62.4,4.2,-67.1,17.1,-70.8C30,-74.5,44.7,-76.4,44.7,-76.4Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
        <svg
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] text-primary opacity-40 dark:opacity-20"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M38.1,-64.8C49.9,-59.1,60.5,-51.3,69.5,-41.8C78.5,-32.3,85.9,-21.1,85.6,-10.1C85.3,0.9,77.3,11.7,69.7,21.8C62.1,31.9,54.9,41.3,45.6,48.8C36.3,56.3,24.9,61.9,13.2,63.9C1.5,65.9,-10.5,64.3,-21.7,59.8C-32.9,55.3,-43.3,47.9,-52.3,38.8C-61.3,29.7,-68.9,18.9,-70.8,7.1C-72.7,-4.7,-68.9,-17.5,-61.7,-28.4C-54.5,-39.3,-43.9,-48.3,-32.6,-54.3C-21.3,-60.3,-9.3,-63.3,2.2,-67.1C13.7,-70.9,26.3,-70.5,38.1,-64.8Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <AppHeader />

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left copy */}
          <div className="lg:col-span-4 lg:py-12 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary bg-opacity-20 text-green-800 dark:text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Live Matchmaking</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              High-Stakes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent-purple">
                Typing Racing
              </span>
            </h1>
            <p className="text-lg text-muted-light dark:text-muted-dark leading-relaxed">
              Stake SOL, type fast, and take the pot. Join the lobby and prove you&apos;re the fastest fingers on-chain.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <StatSmall label="Active Racers" value="1,204" />
              <StatSmall label="Total Pool" value="450 SOL" />
            </div>
          </div>

          {/* Center card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-primary via-secondary to-accent-purple opacity-20 blur-3xl rounded-full"></div>
            <div className="relative bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center text-center overflow-hidden">
              <div className="mb-8 w-full flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-light dark:text-muted-dark">
                  Entry Stake
                </span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
              </div>

              <div className="relative w-full mb-8">
                <div className="flex items-center justify-center space-x-6">
                  <button
                    onClick={() => setStake((s) => Math.max(0.1, Math.round((s - 0.1) * 10) / 10))}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-muted-light dark:text-muted-dark"
                    aria-label="decrease stake"
                  >
                    <span className="material-icons-outlined">remove</span>
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-6xl md:text-7xl font-black tracking-tighter">
                      {stake.toFixed(1)}
                    </span>
                    <span className="text-xl font-medium text-muted-light dark:text-muted-dark mt-2">
                      SOL
                    </span>
                  </div>
                  <button
                    onClick={() => setStake((s) => Math.min(50, Math.round((s + 0.1) * 10) / 10))}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-muted-light dark:text-muted-dark"
                    aria-label="increase stake"
                  >
                    <span className="material-icons-outlined">add</span>
                  </button>
                </div>
                <div className="mt-4 flex justify-center space-x-2">
                  {[0.1, 1, 5].map((v) => (
                    <button
                      key={v}
                      onClick={() => setStake(v)}
                      className={
                        stake === v
                          ? "text-xs font-semibold px-3 py-1 rounded-full bg-primary text-black shadow-[0_0_15px_rgba(212,232,98,0.5)]"
                          : "text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-black transition-colors"
                      }
                    >
                      {v} SOL
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full bg-background-light dark:bg-background-dark rounded-xl p-4 mb-8 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-light dark:text-muted-dark">
                  Potential Win
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  ~{potentialWin.toFixed(1)} SOL
                </span>
              </div>

              <Link
                href="/game?mode=create"
                className="w-full py-4 bg-primary hover:bg-[#B8D43B] text-black font-extrabold text-lg rounded-xl shadow-lg hover:shadow-[0_0_15px_rgba(212,232,98,0.5)] transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Confirm Stake &amp; Create Room</span>
                <span className="material-icons-outlined text-xl">arrow_forward</span>
              </Link>
              <p className="mt-4 text-xs text-muted-light dark:text-muted-dark">
                Gas fees apply. Match starts instantly when opponent is found.
              </p>
            </div>
          </div>

          {/* Right rules */}
          <div className="lg:col-span-3 space-y-6 lg:pl-6">
            <div className="bg-white dark:bg-surface-dark bg-opacity-60 dark:bg-opacity-60 backdrop-blur-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <span className="material-icons-outlined mr-2 text-secondary">info</span>
                Match Rules
              </h3>
              <ul className="space-y-4">
                <RuleItem n="1" title="1v1 Format" desc="Head-to-head race. First to complete the text accurately wins." />
                <RuleItem n="2" title="Winner Take All" desc="Winner claims 95% of the total pot. 5% platform fee." />
                <RuleItem n="3" title="Anti-Cheat" desc="Typing patterns are recorded and results are verifiable." />
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <a className="text-sm font-medium text-accent-purple hover:underline flex items-center" href="#">
                  Read Full Documentation
                  <span className="material-icons-outlined text-sm ml-1">open_in_new</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="text-sm text-muted-light dark:text-muted-dark mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function RuleItem({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="flex items-start">
      <span className="bg-gray-100 dark:bg-gray-800 text-xs font-bold px-2 py-1 rounded mr-3 mt-0.5 min-w-[24px] text-center">
        {n}
      </span>
      <div className="text-sm text-muted-light dark:text-muted-dark">
        <span className="block font-semibold text-text-light dark:text-text-dark">{title}</span>
        {desc}
      </div>
    </li>
  );
}

