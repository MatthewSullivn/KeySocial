"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/user-store";
import { getContents, type TapestryContent } from "@/lib/tapestry";
import AppHeader from "@/components/layout/AppHeader";

export default function HomePage() {
  const { profile } = useUserStore();
  const [recentMatches, setRecentMatches] = useState<TapestryContent[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, bestWpm: 0, avgWpm: 0, totalMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);
    try {
      const contents = await getContents(50, 0, profile?.id || profile?.username || undefined);
      const matches = contents.filter((c) => c.properties?.type === "match_result");

      const seen = new Set<string>();
      const deduped: TapestryContent[] = [];
      for (const m of matches) {
        const p = m.properties || {};
        const ts = m.createdAt ? Math.floor(new Date(m.createdAt).getTime() / 5000) : "";
        const key = `${p.winnerId}-${p.loserId}-${p.winnerWPM}-${p.loserWPM}-${ts}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(m);
        }
      }

      setRecentMatches(deduped.slice(0, 5));

      if (profile) {
        const pid = profile.id || profile.username;
        let wins = 0, losses = 0, totalWpm = 0, bestWpm = 0;
        for (const m of deduped) {
          const p = m.properties || {};
          const isWinner = p.winnerId === pid;
          if (isWinner) wins++;
          else losses++;
          const wpm = parseInt(isWinner ? p.winnerWPM : p.loserWPM, 10) || 0;
          totalWpm += wpm;
          if (wpm > bestWpm) bestWpm = wpm;
        }
        setStats({
          wins,
          losses,
          bestWpm,
          avgWpm: deduped.length > 0 ? Math.round(totalWpm / deduped.length) : 0,
          totalMatches: deduped.length,
        });
      }
    } catch (err) {
      console.error("Failed to load homepage data:", err);
    } finally {
      setLoading(false);
    }
  }

  const rankLabel = stats.wins >= 50 ? "Legend" : stats.wins >= 30 ? "Diamond" : stats.wins >= 20 ? "Platinum" : stats.wins >= 10 ? "Gold" : stats.wins >= 5 ? "Silver" : "Bronze";
  const rankColor = stats.wins >= 50 ? "text-yellow-300" : stats.wins >= 30 ? "text-purple-300" : stats.wins >= 20 ? "text-purple-400" : stats.wins >= 10 ? "text-yellow-400" : stats.wins >= 5 ? "text-gray-300" : "text-amber-600";

  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/60 via-bg-card to-bg-card border border-purple-500/15">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-700/20 rounded-full blur-[80px]" />
            <svg className="absolute right-8 bottom-0 h-64 w-64 text-purple-500/10" viewBox="0 0 200 200">
              <path d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,32.2C59,42.9,47.1,51.4,35,58.8C22.9,66.2,10.6,72.5,-0.6,73.6C-11.8,74.7,-24.6,70.6,-36.4,63.6C-48.2,56.6,-59,46.7,-67.2,35.1C-75.4,23.5,-81,10.2,-81.1,-3.2C-81.2,-16.6,-75.8,-30.1,-66.4,-41.2C-57,-52.3,-43.6,-61,-30.3,-68.6C-17,-76.2,-3.8,-82.7,8.2,-96.9L44.7,-76.4Z" fill="currentColor" transform="translate(100 100)" />
            </svg>
          </div>

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              LIVE &bull; DEVNET
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight mb-4">
              Type Fast.{" "}
              <span className="italic bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Win On-Chain.
              </span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
              Compete in high-stakes typing races, climb the leaderboards, and prove your speed on Solana.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/game?mode=create"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-glow-md"
              >
                <span className="material-icons text-lg">bolt</span>
                Start Racing
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-bg-elevated border border-purple-500/20 text-gray-300 font-bold rounded-xl hover:bg-bg-hover hover:text-white transition-all"
              >
                <span className="material-icons text-lg">emoji_events</span>
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Season Rank / WPM Card */}
          <div className="lg:col-span-3 bg-bg-card border border-purple-500/10 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Circular WPM gauge */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1C1838" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#purpleGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(100, (stats.bestWpm / 150) * 100) * 3.267} 326.7`}
                  />
                  <defs>
                    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-display font-extrabold">{stats.bestWpm || "—"}</span>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">WPM</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-display font-bold mb-1">Season Rank</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {profile
                    ? `${stats.totalMatches} matches played this season`
                    : "Connect wallet to track your stats"}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/15 border border-purple-500/25 mb-4">
                  <span className="material-icons text-sm text-purple-400">military_tech</span>
                  <span className={`text-sm font-bold ${rankColor}`}>{rankLabel}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                    <span className="uppercase font-bold tracking-wider">Level Progress</span>
                    <span>{stats.wins} / {stats.wins < 5 ? 5 : stats.wins < 10 ? 10 : stats.wins < 20 ? 20 : stats.wins < 30 ? 30 : 50} wins</span>
                  </div>
                  <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (stats.wins / (stats.wins < 5 ? 5 : stats.wins < 10 ? 10 : stats.wins < 20 ? 20 : stats.wins < 30 ? 30 : 50)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile / Achievement Card */}
          <div className="lg:col-span-2 bg-bg-card border border-purple-500/10 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-glow-md">
                {profile ? (
                  <span className="text-3xl font-display font-extrabold text-white">
                    {profile.username?.[0]?.toUpperCase() || "?"}
                  </span>
                ) : (
                  <span className="material-icons text-3xl text-white/80">person</span>
                )}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-green border-2 border-bg-card" />
            </div>

            <h3 className="font-display font-bold text-lg mb-0.5">
              {profile ? profile.username : "Guest Racer"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {profile ? "Current Achievements" : "Connect to get started"}
            </p>

            {profile ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-green/15 flex items-center justify-center" title="Wins">
                  <span className="material-icons text-accent-green text-lg">emoji_events</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center" title="Speed">
                  <span className="material-icons text-purple-400 text-lg">speed</span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-accent-pink/15 flex items-center justify-center" title="Social">
                  <span className="material-icons text-accent-pink text-lg">favorite</span>
                </div>
              </div>
            ) : (
              <Link
                href="/create-profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/15 border border-purple-500/25 rounded-xl text-purple-300 text-sm font-semibold hover:bg-purple-500/25 transition-all"
              >
                Create Profile
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="sports_esports" label="Total Matches" value={String(stats.totalMatches)} />
          <StatCard icon="local_fire_department" label="Win Rate" value={stats.totalMatches > 0 ? `${Math.round((stats.wins / stats.totalMatches) * 100)}%` : "—"} />
          <StatCard icon="speed" label="Avg WPM" value={stats.avgWpm ? String(stats.avgWpm) : "—"} />
          <StatCard icon="leaderboard" label="Best WPM" value={stats.bestWpm ? String(stats.bestWpm) : "—"} />
        </div>

        {/* Recent Races */}
        <div className="bg-bg-card border border-purple-500/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
            <div className="flex items-center gap-2">
              <span className="material-icons text-purple-400">history</span>
              <h2 className="font-display font-bold text-lg">Recent Races</h2>
            </div>
            <Link href="/leaderboard" className="text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <span className="material-icons animate-spin mr-2 align-middle">progress_activity</span>
              Loading...
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-icons text-4xl text-gray-600 mb-2 block">sports_esports</span>
              <p className="text-gray-500 mb-3">No races yet</p>
              <Link href="/game" className="text-purple-400 font-semibold hover:text-purple-300 text-sm">
                Play your first race →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-purple-500/5">
              {recentMatches.map((match, idx) => {
                const p = match.properties || {};
                const pid = profile?.id || profile?.username || "";
                const isWinner = p.winnerId === pid;
                const wpm = parseInt(isWinner ? p.winnerWPM : p.loserWPM, 10) || 0;
                const timeAgo = match.createdAt ? formatTimeAgo(match.createdAt) : "—";
                return (
                  <div key={match.id || idx} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isWinner ? "bg-accent-green/15" : "bg-accent-red/15")}>
                        <span className={cn("material-icons", isWinner ? "text-accent-green" : "text-accent-red")}>
                          {isWinner ? "emoji_events" : "close"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          Race vs {isWinner ? (p.loserUsername || "Opponent") : (p.winnerUsername || "Opponent")}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo} &bull; {p.difficulty || "Ranked"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className={cn("text-xs font-bold", isWinner ? "text-accent-green" : "text-accent-red")}>
                          {isWinner ? "1st Place" : "2nd Place"}
                        </span>
                        <p className="text-xs text-gray-500">{wpm} WPM</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-bg-card border border-purple-500/10 rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
        <span className="material-icons text-purple-400">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-xl font-display font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  if (ms < 604800000) return `${Math.floor(ms / 86400000)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
