"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import type { ReactNode } from "react";
import type { TapestryProfile } from "@/lib/tapestry";

const TRENDING = [
  { id: "1", type: "race", label: "Race #8821", title: "Solana Speedrun", count: "2.4k", href: "/game" },
  { id: "2", type: "tournament", label: "Tournament", title: "Midnight Typist Cup", count: "12k", href: "/match" },
  { id: "3", type: "community", label: "Community", title: "Keyboard Mods", count: "856", href: "/leaderboard" },
];

const LIVE_RACES = [
  { id: "1", name: "Crypto Typers", progress: 40, total: 8, isTeal: true },
  { id: "2", name: "Speed Demon", progress: 70, total: 10, isTeal: false },
];

type FeedFilter = "following" | "top" | "global";

interface FeedLayoutProps {
  profile: TapestryProfile | null;
  filter: FeedFilter;
  onFilterChange: (f: FeedFilter) => void;
  postText: string;
  onPostTextChange: (v: string) => void;
  onPost: () => void;
  onChallenge: () => void;
  onFlexWPM: () => void;
  posting: boolean;
  loading: boolean;
  feedContent: ReactNode;
}

export function FeedLayout(props: FeedLayoutProps) {
  const {
    profile,
    filter,
    onFilterChange,
    postText,
    onPostTextChange,
    onPost,
    onChallenge,
    onFlexWPM,
    posting,
    loading,
    feedContent,
  } = props;

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans min-h-screen transition-colors duration-300">
      <AppHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-20 left-[-50px] w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 floating-blob" />
        <div className="absolute top-40 right-[-50px] w-80 h-80 bg-accent-pink/10 rounded-full blur-3xl -z-10 floating-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-accent-teal/20 rounded-full blur-3xl -z-10 floating-blob" style={{ animationDelay: "1s" }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark border-2 border-slate-900 dark:border-slate-700 rounded-xl p-6 shadow-pop">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-black text-xl font-black shrink-0">
                    {(profile?.username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-accent-teal w-4 h-4 rounded-full border-2 border-slate-900 dark:border-slate-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight truncate">{profile?.username || "Guest"}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@{profile?.username || "connect_wallet"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                  <span className="block text-2xl font-display font-bold text-slate-900 dark:text-white">—</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">WPM Avg</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                  <span className="block text-2xl font-display font-bold text-slate-900 dark:text-white">—</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">Wins</span>
                </div>
              </div>
              <Link href={profile ? "/game" : "/create-profile"} className="block w-full bg-primary text-slate-900 font-bold py-2 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-pop-sm hover:shadow-pop hover:-translate-y-0.5 transition-all text-sm uppercase text-center">
                Start Race
              </Link>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h4 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-icons text-accent-pink">trending_up</span> Trending
              </h4>
              <ul className="space-y-3">
                {TRENDING.map((t) => (
                  <li key={t.id}>
                    <Link href={t.href} className="group flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md transition-colors">
                      <div>
                        <span className="text-xs text-slate-500 block">{t.label}</span>
                        <span className="font-medium text-sm group-hover:text-accent-blue transition-colors">{t.title}</span>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-xs px-2 py-1 rounded-full text-slate-600 dark:text-slate-300">{t.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="col-span-1 lg:col-span-6 space-y-6">
            <div id="compose" className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
                  {(profile?.username || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea value={postText} onChange={(e) => onPostTextChange(e.target.value)} placeholder="Share your latest race results or challenge someone..." className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none h-20 p-0" rows={3} disabled={!profile} />
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1">
                      <button type="button" onClick={onFlexWPM} disabled={!profile} className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-accent-pink hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors text-xs font-medium disabled:opacity-40" title="Flex your WPM"><span className="material-icons text-lg">emoji_events</span><span className="hidden sm:inline">Flex WPM</span></button>
                      <button type="button" onClick={onChallenge} disabled={!profile} className="flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-accent-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs font-medium disabled:opacity-40" title="Challenge someone"><span className="material-icons text-lg">swords</span><span className="hidden sm:inline">Challenge</span></button>
                    </div>
                    <button type="button" onClick={onPost} disabled={!profile || !postText.trim() || posting} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-1.5 rounded-lg font-bold text-sm shadow-pop-sm hover:shadow-pop hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-1 bg-surface-light dark:bg-surface-dark p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(["following", "top", "global"] as const).map((f) => (
                <button key={f} onClick={() => onFilterChange(f)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${filter === f ? "font-bold text-slate-900 dark:text-white bg-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  {f === "top" ? "Top Races" : f === "global" ? "Global" : "Following"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center text-slate-500 border border-slate-200 dark:border-slate-700">Loading…</div>
            ) : (
              feedContent
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-display font-bold text-lg flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Races</h4>
                <Link href="/match" className="text-xs font-bold text-accent-blue hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {LIVE_RACES.map((r) => (
                  <Link key={r.id} href="/match" className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer group">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${r.isTeal ? "bg-accent-teal/20 text-accent-teal" : "bg-accent-pink/20 text-accent-pink"}`}>#{r.id}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between"><span className="font-bold text-sm truncate">{r.name}</span><span className="text-xs text-slate-500">{Math.round(r.progress / 10 * r.total)}/{r.total}</span></div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${r.isTeal ? "bg-accent-teal" : "bg-accent-pink"}`} style={{ width: `${r.progress}%` }} />
                      </div>
                    </div>
                    <span className="material-icons text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-lg">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 px-2">
              <Link href="#" className="hover:underline">About</Link>
              <Link href="#" className="hover:underline">Terms</Link>
              <Link href="#" className="hover:underline">Privacy</Link>
              <Link href="#" className="hover:underline">Docs</Link>
              <span>© 2024 KeySocial</span>
            </div>
          </aside>
        </div>
      </main>

      <button type="button" onClick={() => document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" })} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-pop flex items-center justify-center z-50 hover:scale-110 transition-transform" aria-label="New post">
        <span className="material-icons">edit</span>
      </button>
    </div>
  );
}
