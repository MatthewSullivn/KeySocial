"use client";

import { useEffect, useState } from "react";
import { getContents, getFollowing, type TapestryContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

type LeaderboardTab = "global" | "friends";
type TimeFilter = "all" | "season" | "weekly";

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
  const [tab, setTab] = useState<LeaderboardTab>("global");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [friendUsernames, setFriendUsernames] = useState<Set<string> | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const { profile } = useUserStore();

  useEffect(() => { loadLeaderboard(); }, []);

  useEffect(() => {
    if (tab !== "friends" || !profile) return;
    const pid = profile.id || profile.username;
    if (!pid) return;
    setFriendsLoading(true);
    getFollowing(pid, 200, 0)
      .then((list) => {
        const set = new Set(list.map((p) => p.username).filter(Boolean));
        set.add(profile.username);
        setFriendUsernames(set);
      })
      .catch(() => setFriendUsernames(new Set()))
      .finally(() => setFriendsLoading(false));
  }, [tab, profile]);

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

  const allSorted = [...entries].sort((a, b) => {
    const aTotal = a.wins + a.losses;
    const bTotal = b.wins + b.losses;
    if (bTotal !== aTotal) return bTotal - aTotal;
    return b.bestWPM - a.bestWPM;
  });

  const sortedEntries = tab === "friends" && friendUsernames
    ? allSorted.filter((e) => friendUsernames.has(e.username))
    : allSorted;

  const myId = profile?.id || profile?.username;

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <AppHeader />

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Global Standing <span className="text-purple-500">&amp; Analytics</span>
          </h1>
          <p className="text-gray-500">
            {tab === "friends"
              ? "See how you stack up against the racers you follow."
              : "Top typists on Solana. Join the race, type fast, and climb the ranks."}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
            {(["all", "season", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === f
                    ? "bg-purple-500 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {f === "all" ? "All Time" : f === "season" ? "Season 1" : "Weekly"}
              </button>
            ))}
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => setTab("global")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "global"
                  ? "bg-purple-500 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setTab("friends")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === "friends"
                  ? "bg-purple-500 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Friends
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-3">Typist</div>
            <div className="col-span-2 text-center">Avg WPM</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Total Matches</div>
            <div className="col-span-2 text-right">Total SOL Won</div>
          </div>

          {loading || (tab === "friends" && friendsLoading) ? (
            <div className="p-10 text-center text-gray-500">
              <span className="material-icons animate-spin mr-2 align-middle">progress_activity</span>
              Loading…
            </div>
          ) : tab === "friends" && sortedEntries.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <span className="material-icons text-4xl mb-2 block text-gray-300">group</span>
              Follow some racers to see them here!
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <span className="material-icons text-4xl mb-2 block text-gray-300">sports_esports</span>
              No matches played yet. <Link href="/game" className="text-purple-600 font-bold hover:underline">Play your first game!</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedEntries.map((entry, idx) => {
                const rank = idx + 1;
                const total = entry.wins + entry.losses;
                const winRate = total > 0 ? Math.round((entry.wins / total) * 1000) / 10 : 0;
                const isMe = entry.profileId === myId;

                const rowBorderClass = rank === 1
                  ? "border-l-4 border-l-yellow-400 bg-yellow-50/50"
                  : rank === 2
                  ? "border-l-4 border-l-gray-400 bg-gray-50/50"
                  : rank === 3
                  ? "border-l-4 border-l-orange-400 bg-orange-50/50"
                  : isMe
                  ? "border-l-4 border-l-purple-500 bg-purple-50/50"
                  : "";

                return (
                  <Link
                    key={entry.profileId}
                    href={`/profile/${entry.username}`}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${rowBorderClass}`}
                  >
                    <div className="col-span-1 text-center font-bold text-gray-500">
                      {rank <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-gray-300 text-gray-700" : "bg-orange-400 text-white"}`}>
                          {rank}
                        </span>
                      ) : (
                        rank
                      )}
                    </div>
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {entry.username[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                          @{entry.username}
                          {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-bold">YOU</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.wins}W - {entry.losses}L
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono font-bold text-lg text-gray-900">{entry.bestWPM}</span>
                      <span className="text-xs text-gray-500 ml-1">WPM</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-mono text-gray-900">{winRate}%</span>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${winRate}%` }} />
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-mono text-sm text-gray-700">
                      {total}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-purple-600">
                      {entry.totalEarnings > 0 ? "+" : ""}{entry.totalEarnings.toFixed(2)} SOL
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {sortedEntries.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              Showing 1 to {sortedEntries.length} of {sortedEntries.length} typists
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
