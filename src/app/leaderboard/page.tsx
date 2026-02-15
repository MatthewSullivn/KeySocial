"use client";

import { useEffect, useState } from "react";
import { getContents } from "@/lib/tapestry";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

interface LeaderboardEntry {
  username: string;
  profileId: string;
  wins: number;
  losses: number;
  bestWPM: number;
  avgAccuracy: number;
  totalEarnings: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const contents = await getContents(100, 0);

      // Aggregate match results into leaderboard entries
      const playerMap = new Map<string, LeaderboardEntry>();

      for (const content of contents) {
        const props = content.properties || {};
        if (props.type !== "match_result") continue;

        const winnerId = props.winnerId;
        const loserId = props.loserId;
        const winnerUsername = props.winnerUsername || winnerId;
        const loserUsername = props.loserUsername || loserId;
        const winnerWPM = parseInt(props.winnerWPM || "0");
        const loserWPM = parseInt(props.loserWPM || "0");
        const winnerAccuracy = parseInt(props.winnerAccuracy || "0");
        const loserAccuracy = parseInt(props.loserAccuracy || "0");
        const stakeAmount = parseFloat(props.stakeAmount || "0");

        // Update winner
        if (winnerId) {
          const existing = playerMap.get(winnerId) || {
            username: winnerUsername,
            profileId: winnerId,
            wins: 0,
            losses: 0,
            bestWPM: 0,
            avgAccuracy: 0,
            totalEarnings: 0,
          };
          existing.wins += 1;
          existing.bestWPM = Math.max(existing.bestWPM, winnerWPM);
          existing.avgAccuracy = Math.round(
            (existing.avgAccuracy * (existing.wins + existing.losses - 1) + winnerAccuracy) /
              (existing.wins + existing.losses)
          );
          existing.totalEarnings += stakeAmount;
          playerMap.set(winnerId, existing);
        }

        // Update loser
        if (loserId) {
          const existing = playerMap.get(loserId) || {
            username: loserUsername,
            profileId: loserId,
            wins: 0,
            losses: 0,
            bestWPM: 0,
            avgAccuracy: 0,
            totalEarnings: 0,
          };
          existing.losses += 1;
          existing.bestWPM = Math.max(existing.bestWPM, loserWPM);
          existing.avgAccuracy = Math.round(
            (existing.avgAccuracy * (existing.wins + existing.losses - 1) + loserAccuracy) /
              (existing.wins + existing.losses)
          );
          existing.totalEarnings -= stakeAmount;
          playerMap.set(loserId, existing);
        }
      }

      const leaderboard = Array.from(playerMap.values());
      setEntries(leaderboard);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const sortedEntries = [...entries].sort((a, b) => b.totalEarnings - a.totalEarnings);
  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3, 30);

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 relative">
          <div className="absolute -top-10 -left-20 w-32 h-32 bg-accent-lime rounded-full blur-2xl opacity-20 hidden md:block"></div>
          <div className="absolute top-0 -right-20 w-40 h-40 bg-accent-purple rounded-full blur-2xl opacity-10 hidden md:block"></div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Global Racing Standings
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Top typists earning huge rewards on Solana. Join the race, type fast, and climb the ranks.
          </p>
        </div>

        {/* Podium */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-20 px-4">
          <PodiumBlock place={2} entry={top3[1]} />
          <PodiumBlock place={1} entry={top3[0]} />
          <PodiumBlock place={3} entry={top3[2]} />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-black/10 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-3 text-center">Win Rate</div>
            <div className="col-span-3 text-right">Total Earnings</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading…</div>
          ) : rest.length === 0 ? (
            <div className="p-10 text-center text-slate-500">No results yet.</div>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-slate-800">
              {rest.map((entry, idx) => {
                const rank = idx + 4;
                const total = entry.wins + entry.losses;
                const winRate = total > 0 ? Math.round((entry.wins / total) * 1000) / 10 : 0;
                return (
                  <Link
                    key={entry.profileId}
                    href={`/profile/${entry.username}`}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-accent-lime/10 transition-colors"
                  >
                    <div className="col-span-1 text-center font-bold text-slate-500">
                      {rank}
                    </div>
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-slate-700 flex items-center justify-center font-bold">
                        {entry.username[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{entry.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Best {entry.bestWPM} WPM
                        </p>
                      </div>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="font-mono">{winRate}%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-accent-pink h-full rounded-full"
                          style={{ width: `${winRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-3 text-right font-mono font-bold">
                      {entry.totalEarnings.toFixed(2)} SOL
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function PodiumBlock({
  place,
  entry,
}: {
  place: 1 | 2 | 3;
  entry?: LeaderboardEntry;
}) {
  const name = entry?.username || "—";
  const handle = entry ? `@${entry.username.toLowerCase().replace(/\s+/g, "_")}` : "—";
  const sol = entry ? `${Math.max(0, entry.totalEarnings).toFixed(1)} SOL` : "—";
  const ring =
    place === 1
      ? "border-accent-lime"
      : place === 2
      ? "border-accent-pink"
      : "border-accent-teal";

  return (
    <div className={`podium-block w-full md:w-1/3 max-w-xs relative ${place === 1 ? "order-1 md:-order-none" : "order-2 md:order-none"}`}>
      <div className="bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-600 rounded-2xl p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-3 border-2 ${ring} overflow-hidden flex items-center justify-center font-bold`}>
          {name[0]?.toUpperCase() || "?"}
        </div>
        <h3 className="font-bold text-lg">{name}</h3>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-mono mb-2">{handle}</div>
        <div className="bg-accent-lime/10 text-black dark:text-accent-lime px-3 py-1 rounded-full text-xs font-bold border border-accent-lime">
          {sol}
        </div>
      </div>
      <div className="h-20 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-black dark:border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
        <span className="text-2xl font-extrabold">{place}</span>
      </div>
    </div>
  );
}
