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

function aggregateMatches(tapestryContents: TapestryContent[]): Map<string, LeaderboardEntry> {
  const playerMap = new Map<string, LeaderboardEntry>();

  function processMatch(
    winnerId: string, loserId: string, winnerUsername: string, loserUsername: string,
    winnerWPM: number, loserWPM: number, winnerAccuracy: number, loserAccuracy: number, stakeAmount: number
  ) {
    if (winnerId) {
      const e = playerMap.get(winnerId) || { username: winnerUsername || winnerId, profileId: winnerId, wins: 0, losses: 0, bestWPM: 0, avgAccuracy: 0, totalEarnings: 0 };
      const totalGames = e.wins + e.losses;
      e.wins += 1;
      e.bestWPM = Math.max(e.bestWPM, winnerWPM);
      e.avgAccuracy = totalGames > 0 ? Math.round((e.avgAccuracy * totalGames + winnerAccuracy) / (totalGames + 1)) : winnerAccuracy;
      e.totalEarnings += stakeAmount;
      playerMap.set(winnerId, e);
    }

    if (loserId && loserId !== winnerId) {
      const e = playerMap.get(loserId) || { username: loserUsername || loserId, profileId: loserId, wins: 0, losses: 0, bestWPM: 0, avgAccuracy: 0, totalEarnings: 0 };
      const totalGames = e.wins + e.losses;
      e.losses += 1;
      e.bestWPM = Math.max(e.bestWPM, loserWPM);
      e.avgAccuracy = totalGames > 0 ? Math.round((e.avgAccuracy * totalGames + loserAccuracy) / (totalGames + 1)) : loserAccuracy;
      e.totalEarnings -= stakeAmount;
      playerMap.set(loserId, e);
    }
  }

  const seen = new Set<string>();
  for (const content of tapestryContents) {
    const props = content.properties || {};
    if (props.type !== "match_result") continue;
    const ts = content.createdAt ? Math.floor(new Date(content.createdAt).getTime() / 5000) : "";
    const key = `${props.winnerId}-${props.loserId}-${props.winnerWPM}-${props.loserWPM}-${ts}`;
    if (seen.has(key)) continue;
    seen.add(key);
    processMatch(
      props.winnerId, props.loserId, props.winnerUsername || props.winnerId, props.loserUsername || props.loserId,
      parseInt(props.winnerWPM || "0"), parseInt(props.loserWPM || "0"),
      parseInt(props.winnerAccuracy || "0"), parseInt(props.loserAccuracy || "0"),
      parseFloat(props.stakeAmount || "0")
    );
  }
  return playerMap;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserStore();

  useEffect(() => { loadLeaderboard(); }, []);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      let tapestryContents: TapestryContent[] = [];
      try { tapestryContents = await getContents(100, 0); } catch {}

      const playerMap = aggregateMatches(tapestryContents);

      if (profile) {
        const pid = profile.id || profile.username;
        if (!playerMap.has(pid)) {
          playerMap.set(pid, { username: profile.username || "You", profileId: pid, wins: 0, losses: 0, bestWPM: 0, avgAccuracy: 0, totalEarnings: 0 });
        } else {
          const existing = playerMap.get(pid)!;
          existing.username = profile.username || existing.username;
        }
      }

      const allEntries = Array.from(playerMap.values()).filter((e) => !e.profileId.startsWith("ai-"));
      const byUsername = new Map<string, LeaderboardEntry>();
      for (const e of allEntries) {
        const existing = byUsername.get(e.username);
        if (existing) {
          existing.wins += e.wins;
          existing.losses += e.losses;
          existing.bestWPM = Math.max(existing.bestWPM, e.bestWPM);
          const existTotal = existing.wins + existing.losses - e.wins - e.losses;
          const newTotal = e.wins + e.losses;
          existing.avgAccuracy = existTotal + newTotal > 0 ? Math.round((existing.avgAccuracy * existTotal + e.avgAccuracy * newTotal) / (existTotal + newTotal)) : 0;
          existing.totalEarnings += e.totalEarnings;
          if (e.profileId !== "remote-opponent") existing.profileId = e.profileId;
        } else {
          byUsername.set(e.username, { ...e });
        }
      }
      setEntries(Array.from(byUsername.values()));
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
    <div className="min-h-screen bg-bg-primary text-white flex flex-col">
      <AppHeader />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Global Racing Standings
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Top typists on Solana. Join the race, type fast, and climb the ranks.
          </p>
        </div>

        {/* Podium */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-20 px-4">
          <PodiumBlock place={2} entry={top3[1]} isMe={top3[1]?.profileId === myId} />
          <PodiumBlock place={1} entry={top3[0]} isMe={top3[0]?.profileId === myId} />
          <PodiumBlock place={3} entry={top3[2]} isMe={top3[2]?.profileId === myId} />
        </div>

        {/* Table */}
        <div className="bg-bg-card border border-purple-500/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-purple-500/10 bg-bg-elevated text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-3">Player</div>
            <div className="col-span-2 text-center">Best WPM</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Matches</div>
            <div className="col-span-2 text-right">Earnings</div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              <span className="material-icons animate-spin mr-2 align-middle">progress_activity</span>
              Loading…
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <span className="material-icons text-4xl mb-2 block">sports_esports</span>
              No matches played yet. <Link href="/game" className="text-purple-400 font-bold hover:underline">Play your first game!</Link>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/5">
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const total = entry.wins + entry.losses;
                const winRate = total > 0 ? Math.round((entry.wins / total) * 1000) / 10 : 0;
                const isMe = entry.profileId === myId;
                return (
                  <Link
                    key={entry.profileId}
                    href={`/profile/${entry.username}`}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-purple-500/5 transition-colors ${isMe ? "bg-purple-500/5 border-l-4 border-l-purple-500" : ""}`}
                  >
                    <div className="col-span-1 text-center font-bold text-gray-500">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rank === 1 ? "bg-yellow-400 text-black" : rank === 2 ? "bg-gray-400 text-black" : "bg-amber-600 text-white"}`}>
                          {rank}
                        </span>
                      ) : (
                        rank
                      )}
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-purple-500/15 flex items-center justify-center font-bold">
                        {entry.username[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1.5">
                          {entry.username}
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">YOU</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.wins}W - {entry.losses}L
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono font-bold text-lg">{entry.bestWPM}</span>
                      <span className="text-xs text-gray-500 ml-1">WPM</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono">{winRate}%</span>
                      <div className="w-full bg-bg-elevated h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${winRate}%` }} />
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

function PodiumBlock({ place, entry, isMe }: { place: 1 | 2 | 3; entry?: LeaderboardEntry; isMe?: boolean }) {
  const name = entry?.username || "—";
  const handle = entry ? `@${entry.username.toLowerCase().replace(/\s+/g, "_")}` : "—";
  const totalGames = entry ? entry.wins + entry.losses : 0;
  const ring = place === 1 ? "border-yellow-400" : place === 2 ? "border-gray-400" : "border-amber-600";
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  const className = `podium-block w-full md:w-1/3 max-w-xs relative ${place === 1 ? "order-1 md:-order-none" : "order-2 md:order-none"} group`;
  const inner = (
    <>
      <div className="bg-bg-card border border-purple-500/10 rounded-2xl p-6 mb-4 relative z-10 flex flex-col items-center group-hover:border-purple-500/30 transition-colors">
        {isMe && (
          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">YOU</span>
        )}
        <div className={`w-16 h-16 rounded-full bg-bg-elevated mb-3 border-2 ${ring} overflow-hidden flex items-center justify-center font-bold text-xl`}>
          {name[0]?.toUpperCase() || "?"}
        </div>
        <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">{name}</h3>
        <div className="text-gray-500 text-sm font-mono mb-2">{handle}</div>
        {entry ? (
          <div className="text-center space-y-1">
            <div className="font-mono font-bold text-lg">{entry.bestWPM} <span className="text-xs text-gray-500">WPM</span></div>
            <div className="text-xs text-gray-500">{entry.wins}W - {entry.losses}L ({totalGames} matches)</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No data</div>
        )}
      </div>
      <div className="h-20 rounded-2xl bg-bg-elevated border border-purple-500/10 flex items-center justify-center">
        <span className="text-2xl font-extrabold">{medal} {place}</span>
      </div>
    </>
  );

  if (entry) {
    return <Link href={`/profile/${entry.username}`} className={className}>{inner}</Link>;
  }
  return <div className={className}>{inner}</div>;
}
