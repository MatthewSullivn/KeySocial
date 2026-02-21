"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/user-store";
import { getContents, type TapestryContent } from "@/lib/tapestry";
import AppHeader from "@/components/layout/AppHeader";

export default function HomePage() {
  const { profile, isConnected } = useUserStore();
  const [recentMatches, setRecentMatches] = useState<TapestryContent[]>([]);
  const [stats, setStats] = useState({ wins: 0, losses: 0, bestWpm: 0, avgWpm: 0, totalMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile, isConnected]);

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

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            {/* Profile Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <Link href={profile ? `/profile/${profile.username}` : "#"} className="flex flex-col items-center group">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-black">
                    {profile ? (profile.username?.[0]?.toUpperCase() || "?") : "?"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                  {profile ? profile.username : "Guest Racer"}
                </h3>
                <p className="text-sm text-gray-500">@{profile?.username || "connect_wallet"}</p>
              </Link>
              <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xl font-bold text-gray-900">{stats.avgWpm || "—"}</span>
                  <span className="text-xs text-gray-500 font-medium">Avg WPM</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <span className="block text-xl font-bold text-gray-900">{stats.wins || "—"}</span>
                  <span className="text-xs text-gray-500 font-medium">Wins</span>
                </div>
              </div>
              <Link
                href="/game?mode=create"
                className="block w-full bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm text-center hover:bg-purple-600 transition-colors"
              >
                Start Race
              </Link>
            </div>

            {/* Performance */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-display font-bold text-sm text-gray-900 mb-4">Performance</h4>
              <div className="space-y-3">
                <PerformanceBar label="Win Rate" value={stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0} />
                <PerformanceBar label="Speed" value={Math.min(100, Math.round((stats.bestWpm / 150) * 100))} />
                <PerformanceBar label="Rank Progress" value={Math.min(100, Math.round((stats.wins / (stats.wins < 5 ? 5 : stats.wins < 10 ? 10 : 20)) * 100))} />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-sm text-purple-500">military_tech</span>
                  <span className="text-sm font-bold text-gray-900">{rankLabel}</span>
                  <span className="text-xs text-gray-500">• {stats.totalMatches} matches</span>
                </div>
              </div>
            </div>

            {/* Top Racers */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-display font-bold text-sm text-gray-900 mb-4">Top Racers</h4>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 1 ? "bg-yellow-100 text-yellow-700" : i === 2 ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700"
                    )}>
                      {i}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      ?
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">—</p>
                      <p className="text-xs text-gray-500">— WPM</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/leaderboard" className="block text-center text-sm text-purple-600 font-medium mt-4 hover:text-purple-700">
                View Full Leaderboard
              </Link>
            </div>
          </aside>

          {/* Center Content */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
            {/* Season Rank / WPM Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="10" />
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
                    <span className="text-3xl font-display font-extrabold text-gray-900">{stats.bestWpm || "—"}</span>
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">WPM</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-display font-bold text-gray-900 mb-1">Season Rank</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {profile
                      ? `${stats.totalMatches} matches played this season`
                      : "Connect wallet to track your stats"}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 mb-4">
                    <span className="material-icons text-sm text-purple-500">military_tech</span>
                    <span className="text-sm font-bold text-purple-600">{rankLabel}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span className="uppercase font-bold tracking-wider">Level Progress</span>
                      <span>{stats.wins} / {stats.wins < 5 ? 5 : stats.wins < 10 ? 10 : stats.wins < 20 ? 20 : stats.wins < 30 ? 30 : 50} wins</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
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

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon="sports_esports" label="Total Matches" value={String(stats.totalMatches)} />
              <StatCard icon="local_fire_department" label="Win Rate" value={stats.totalMatches > 0 ? `${Math.round((stats.wins / stats.totalMatches) * 100)}%` : "—"} />
              <StatCard icon="speed" label="Avg WPM" value={stats.avgWpm ? String(stats.avgWpm) : "—"} />
              <StatCard icon="leaderboard" label="Best WPM" value={stats.bestWpm ? String(stats.bestWpm) : "—"} />
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/game?mode=create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors"
              >
                <span className="material-icons text-lg">bolt</span>
                Start Racing
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="material-icons text-lg">emoji_events</span>
                View Leaderboard
              </Link>
            </div>
          </div>

          {/* Right Sidebar (empty for now, matches mockup) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="text-xs text-gray-400 px-2">
              &copy; 2026 KeySocial
            </div>
          </aside>
        </div>

        {/* Match History - Full Width */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="material-icons text-purple-500">history</span>
              <h2 className="font-display font-bold text-lg text-gray-900">Match History</h2>
            </div>
            <Link href="/leaderboard" className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors">
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
              <span className="material-icons text-4xl text-gray-300 mb-2 block">sports_esports</span>
              <p className="text-gray-500 mb-3">No races yet</p>
              <Link href="/game" className="text-purple-600 font-semibold hover:text-purple-700 text-sm">
                Play your first race →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentMatches.map((match, idx) => {
                const p = match.properties || {};
                const pid = profile?.id || profile?.username || "";
                const isWinner = p.winnerId === pid;
                const wpm = parseInt(isWinner ? p.winnerWPM : p.loserWPM, 10) || 0;
                const timeAgo = match.createdAt ? formatTimeAgo(match.createdAt) : "—";
                return (
                  <div key={match.id || idx} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isWinner ? "bg-green-50" : "bg-red-50")}>
                        <span className={cn("material-icons", isWinner ? "text-green-600" : "text-red-500")}>
                          {isWinner ? "emoji_events" : "close"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          Race vs {isWinner ? (p.loserUsername || "Opponent") : (p.winnerUsername || "Opponent")}
                        </p>
                        <p className="text-xs text-gray-500">{timeAgo} &bull; {p.difficulty || "Ranked"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className={cn("text-xs font-bold", isWinner ? "text-green-600" : "text-red-500")}>
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
        <span className="material-icons text-purple-500">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</p>
        <p className="text-xl font-display font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PerformanceBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${value}%` }} />
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
