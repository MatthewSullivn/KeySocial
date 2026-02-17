"use client";

import { useEffect, useState } from "react";
import { getContents, type TapestryContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
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

function aggregateMatches(
  tapestryContents: TapestryContent[]
): Map<string, LeaderboardEntry> {
  const playerMap = new Map<string, LeaderboardEntry>();

  function processMatch(
    winnerId: string,
    loserId: string,
    winnerUsername: string,
    loserUsername: string,
    winnerWPM: number,
    loserWPM: number,
    winnerAccuracy: number,
    loserAccuracy: number,
    stakeAmount: number
  ) {
    if (winnerId) {
      const e = playerMap.get(winnerId) || {
        username: winnerUsername || winnerId,
        profileId: winnerId,
        wins: 0,
        losses: 0,
        bestWPM: 0,
        avgAccuracy: 0,
        totalEarnings: 0,
      };
      const totalGames = e.wins + e.losses;
      e.wins += 1;
      e.bestWPM = Math.max(e.bestWPM, winnerWPM);
      e.avgAccuracy =
        totalGames > 0
          ? Math.round((e.avgAccuracy * totalGames + winnerAccuracy) / (totalGames + 1))
          : winnerAccuracy;
      e.totalEarnings += stakeAmount;
      playerMap.set(winnerId, e);
    }

    if (loserId && loserId !== winnerId) {
      const e = playerMap.get(loserId) || {
        username: loserUsername || loserId,
        profileId: loserId,
        wins: 0,
        losses: 0,
        bestWPM: 0,
        avgAccuracy: 0,
        totalEarnings: 0,
      };
      const totalGames = e.wins + e.losses;
      e.losses += 1;
      e.bestWPM = Math.max(e.bestWPM, loserWPM);
      e.avgAccuracy =
        totalGames > 0
          ? Math.round((e.avgAccuracy * totalGames + loserAccuracy) / (totalGames + 1))
          : loserAccuracy;
      e.totalEarnings -= stakeAmount;
      playerMap.set(loserId, e);
    }
  }

  for (const content of tapestryContents) {
    const props = content.properties || {};
    if (props.type !== "match_result") continue;
    processMatch(
      props.winnerId,
      props.loserId,
      props.winnerUsername || props.winnerId,
      props.loserUsername || props.loserId,
      parseInt(props.winnerWPM || "0"),
      parseInt(props.loserWPM || "0"),
      parseInt(props.winnerAccuracy || "0"),
      parseInt(props.loserAccuracy || "0"),
      parseFloat(props.stakeAmount || "0")
    );
  }

  return playerMap;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserStore();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      let tapestryContents: TapestryContent[] = [];
      try {
        tapestryContents = await getContents(100, 0);
      } catch {}

      const playerMap = aggregateMatches(tapestryContents);

      // Ensure current user is on the leaderboard even with 0 matches
      if (profile) {
        const pid = profile.id || profile.username;
        if (!playerMap.has(pid)) {
          playerMap.set(pid, {
            username: profile.username || "You",
            profileId: pid,
            wins: 0,
            losses: 0,
            bestWPM: 0,
            avgAccuracy: 0,
            totalEarnings: 0,
          });
        } else {
          const existing = playerMap.get(pid)!;
          existing.username = profile.username || existing.username;
        }
      }

      // Filter out bot entries
      const leaderboard = Array.from(playerMap.values()).filter(
        (e) => !e.profileId.startsWith("ai-")
      );

      setEntries(leaderboard);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return b.bestWPM - a.bestWPM;
  });

  const top3 = sortedEntries.slice(0, 3);
  const myId = profile?.id || profile?.username;

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
          <PodiumBlock place={2} entry={top3[1]} isMe={top3[1]?.profileId === myId} />
          <PodiumBlock place={1} entry={top3[0]} isMe={top3[0]?.profileId === myId} />
          <PodiumBlock place={3} entry={top3[2]} isMe={top3[2]?.profileId === myId} />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-black/10 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-3">Player</div>
            <div className="col-span-2 text-center">Best WPM</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Matches</div>
            <div className="col-span-2 text-right">Earnings</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              <span className="material-icons animate-spin mr-2 align-middle">progress_activity</span>
              Loading…
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <span className="material-icons text-4xl mb-2 block">sports_esports</span>
              No matches played yet. <Link href="/game" className="text-primary font-bold hover:underline">Play your first game!</Link>
            </div>
          ) : (
            <div className="divide-y divide-black/10 dark:divide-slate-800">
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const total = entry.wins + entry.losses;
                const winRate = total > 0 ? Math.round((entry.wins / total) * 1000) / 10 : 0;
                const isMe = entry.profileId === myId;
                return (
                  <Link
                    key={entry.profileId}
                    href={`/profile/${entry.username}`}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-accent-lime/10 transition-colors ${isMe ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                  >
                    <div className="col-span-1 text-center font-bold text-slate-500">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rank === 1 ? "bg-yellow-400 text-black" : rank === 2 ? "bg-slate-300 text-black" : "bg-amber-600 text-white"}`}>
                          {rank}
                        </span>
                      ) : (
                        rank
                      )}
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-slate-700 flex items-center justify-center font-bold">
                        {entry.username[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5">
                          {entry.username}
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">YOU</span>}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {entry.wins}W - {entry.losses}L
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono font-bold text-lg">{entry.bestWPM}</span>
                      <span className="text-xs text-slate-400 ml-1">WPM</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono">{winRate}%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-accent-pink h-full rounded-full"
                          style={{ width: `${winRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-mono text-sm">
                      {total}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold">
                      {entry.totalEarnings > 0 ? "+" : ""}{entry.totalEarnings.toFixed(2)} SOL
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
  isMe,
}: {
  place: 1 | 2 | 3;
  entry?: LeaderboardEntry;
  isMe?: boolean;
}) {
  const name = entry?.username || "—";
  const handle = entry ? `@${entry.username.toLowerCase().replace(/\s+/g, "_")}` : "—";
  const totalGames = entry ? entry.wins + entry.losses : 0;
  const ring =
    place === 1
      ? "border-accent-lime"
      : place === 2
      ? "border-accent-pink"
      : "border-accent-teal";
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  return (
    <div className={`podium-block w-full md:w-1/3 max-w-xs relative ${place === 1 ? "order-1 md:-order-none" : "order-2 md:order-none"}`}>
      <div className="bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-600 rounded-2xl p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10 flex flex-col items-center">
        {isMe && (
          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">YOU</span>
        )}
        <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-3 border-2 ${ring} overflow-hidden flex items-center justify-center font-bold text-xl`}>
          {name[0]?.toUpperCase() || "?"}
        </div>
        <h3 className="font-bold text-lg">{name}</h3>
        <div className="text-slate-500 dark:text-slate-400 text-sm font-mono mb-2">{handle}</div>
        {entry ? (
          <div className="text-center space-y-1">
            <div className="font-mono font-bold text-lg">{entry.bestWPM} <span className="text-xs text-slate-400">WPM</span></div>
            <div className="text-xs text-slate-500">{entry.wins}W - {entry.losses}L ({totalGames} matches)</div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">No data</div>
        )}
      </div>
      <div className="h-20 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-black dark:border-slate-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
        <span className="text-2xl font-extrabold">{medal} {place}</span>
      </div>
    </div>
  );
}
