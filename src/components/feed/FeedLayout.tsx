"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import type { ReactNode } from "react";
import type { TapestryProfile } from "@/lib/tapestry";
import type { PendingPostType, PendingMeta } from "./FeedView";

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
  onCancelPending: () => void;
  pendingType: PendingPostType;
  pendingMeta: PendingMeta;
  posting: boolean;
  loading: boolean;
  stats: { wpmAvg: number; wins: number };
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
    onCancelPending,
    pendingType,
    pendingMeta,
    posting,
    loading,
    stats,
    feedContent,
  } = props;

  const hasPending = pendingType !== "normal";

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
              <Link href={profile ? `/profile/${profile.username}` : "#"} className="flex items-center gap-4 mb-4 group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-black text-xl font-black shrink-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                    {(profile?.username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-accent-teal w-4 h-4 rounded-full border-2 border-slate-900 dark:border-slate-700" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{profile?.username || "Guest"}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">@{profile?.username || "connect_wallet"}</p>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                  <span className="block text-2xl font-display font-bold text-slate-900 dark:text-white">{stats.wpmAvg || "—"}</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">WPM Avg</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                  <span className="block text-2xl font-display font-bold text-slate-900 dark:text-white">{stats.wins || "—"}</span>
                  <span className="text-xs text-slate-500 uppercase font-bold">Wins</span>
                </div>
              </div>
              <Link href={profile ? "/game" : "/create-profile"} className="block w-full bg-primary text-slate-900 font-bold py-2 rounded-lg border-2 border-slate-900 dark:border-slate-600 shadow-pop-sm hover:shadow-pop hover:-translate-y-0.5 transition-all text-sm uppercase text-center">
                Start Race
              </Link>
            </div>

          </aside>

          <div className="col-span-1 lg:col-span-6 space-y-6">
            <div id="compose" className={`bg-surface-light dark:bg-surface-dark border rounded-xl p-4 shadow-sm relative overflow-hidden group focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all ${hasPending ? (pendingType === "flex" ? "border-accent-pink" : "border-accent-blue") : "border-slate-200 dark:border-slate-700"}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${hasPending ? (pendingType === "flex" ? "bg-accent-pink" : "bg-accent-blue") : "bg-primary"}`} />
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
                  {(profile?.username || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea value={postText} onChange={(e) => onPostTextChange(e.target.value)} placeholder="Share your latest race results or challenge someone..." className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none h-20 p-0" rows={3} disabled={!profile} />

                  {pendingType === "flex" && pendingMeta.wpm != null && (
                    <ComposerFlexPreview wpm={pendingMeta.wpm} onCancel={onCancelPending} />
                  )}

                  {pendingType === "challenge" && (
                    <ComposerChallengePreview username={pendingMeta.challengerUsername || profile?.username || "you"} onCancel={onCancelPending} />
                  )}

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1 items-center">
                      <button type="button" onClick={onFlexWPM} disabled={!profile || pendingType === "flex"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "flex" ? "text-accent-pink" : "text-slate-400 hover:text-accent-pink"}`} title="Flex your WPM"><span className="material-icons text-base">emoji_events</span><span className="hidden sm:inline">Flex WPM</span></button>
                      <button type="button" onClick={onChallenge} disabled={!profile || pendingType === "challenge"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "challenge" ? "text-accent-blue" : "text-slate-400 hover:text-accent-blue"}`} title="Challenge someone"><span className="material-icons text-base">swords</span><span className="hidden sm:inline">Challenge</span></button>
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
                  {f === "top" ? "Top Posts" : f === "global" ? "Global" : "Following"}
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
            <div className="text-xs text-slate-500 px-2">
              <span>© 2026 KeySocial</span>
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

function ComposerFlexPreview({ wpm, onCancel }: { wpm: number; onCancel: () => void }) {
  const tier =
    wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 40 ? "Intermediate" : "Beginner";

  return (
    <div className="mt-2 rounded-lg border border-accent-pink/40 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-pink/20 flex items-center justify-center">
          <span className="material-icons text-accent-pink">emoji_events</span>
        </div>
        <div>
          <div className="text-xs font-bold text-accent-pink uppercase">WPM Flex Card</div>
          <div className="font-display font-bold text-lg">{wpm} WPM <span className="text-xs font-normal text-slate-500">• {tier}</span></div>
        </div>
      </div>
    </div>
  );
}

function ComposerChallengePreview({ username, onCancel }: { username: string; onCancel: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-accent-blue/40 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
          <span className="material-icons text-accent-blue">swords</span>
        </div>
        <div>
          <div className="text-xs font-bold text-accent-blue uppercase">Challenge Card</div>
          <div className="font-bold text-sm">@{username} is challenging you to a 1v1 race</div>
        </div>
      </div>
    </div>
  );
}
