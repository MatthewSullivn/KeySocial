"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { getContents, type TapestryContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
import AppHeader from "@/components/layout/AppHeader";

export default function SocialFeedPage() {
  const { connected } = useWallet();
  const { profile } = useUserStore();
  const [items, setItems] = useState<TapestryContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const contents = await getContents(30, 0);
        setItems(contents);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const matchPosts = useMemo(() => {
    // Prefer match results when available; otherwise show any content.
    const matches = items.filter((c) => (c.properties || {}).type === "match_result");
    return matches.length > 0 ? matches : items;
  }, [items]);

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased min-h-screen relative overflow-x-hidden selection:bg-accent selection:text-primary">
      {/* blobs */}
      <div className="blob-bg w-96 h-96 bg-accent rounded-full -top-20 -left-20"></div>
      <div className="blob-bg w-[500px] h-[500px] bg-accent rounded-full top-1/3 -right-40"></div>
      <div className="blob-bg w-80 h-80 bg-accent-purple rounded-full bottom-0 left-1/3 opacity-20 dark:opacity-10"></div>

      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left sidebar */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-gray-900 dark:text-white">
                    {profile?.username || "Guest"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Social Racer</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold">
                  {(profile?.username || "K")[0]?.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">WPM</span>
                  <span className="font-bold text-black dark:text-white">—</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">Rank</span>
                  <span className="font-bold text-black dark:text-white">—</span>
                </div>
              </div>
              <Link
                href={profile ? `/profile/${profile.username || profile.id}` : "/create-profile"}
                className="mt-4 block w-full text-center bg-accent hover:bg-accent-dark text-black px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                View Profile
              </Link>
              {!connected && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Connect your wallet from the top bar.
                </div>
              )}
            </div>
          </div>

          {/* Main feed */}
          <main className="lg:col-span-6 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                  Social Feed
                </h2>
                <Link className="text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white" href="/leaderboard">
                  See standings →
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                On-chain match results &amp; posts (Tapestry).
              </p>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-gray-500">Loading…</div>
              ) : matchPosts.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No posts yet. Play a match to generate results.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {matchPosts.slice(0, 30).map((post) => {
                    const props = post.properties || {};
                    const isMatch = props.type === "match_result";
                    const title = isMatch ? "Race Result" : "Post";
                    return (
                      <article key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-display font-bold text-gray-900 dark:text-white">
                              {title}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                              {post.content}
                            </p>
                          </div>
                          {isMatch && (
                            <Link
                              href={`/profile/${props.winnerUsername || props.winnerId || ""}`}
                              className="text-sm font-bold text-black dark:text-white hover:underline"
                            >
                              Winner
                            </Link>
                          )}
                        </div>

                        {isMatch && (
                          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-black">
                                <span className="material-icons">emoji_events</span>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Stake</div>
                                <div className="font-mono font-bold text-black dark:text-white">
                                  {props.stakeAmount || "0"} SOL
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">WPM (W/L)</div>
                              <div className="font-mono font-bold text-black dark:text-white">
                                {props.winnerWPM || "—"} / {props.loserWPM || "—"}
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-display font-bold text-gray-900 dark:text-white mb-4">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link className="block rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-accent hover:text-black transition-colors font-medium" href="/match">
                  Create Race
                </Link>
                <Link className="block rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-accent hover:text-black transition-colors font-medium" href="/leaderboard">
                  Leaderboard
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

