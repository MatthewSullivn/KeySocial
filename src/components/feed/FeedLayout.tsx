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
    <div className="min-h-screen bg-bg-primary text-white font-body">
      <AppHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-bg-card border border-purple-500/10 rounded-xl p-6">
              <Link href={profile ? `/profile/${profile.username}` : "#"} className="flex items-center gap-4 mb-4 group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xl font-black shrink-0 group-hover:shadow-glow-sm transition-all">
                    {(profile?.username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-accent-green w-4 h-4 rounded-full border-2 border-bg-card" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight truncate group-hover:text-purple-400 transition-colors">{profile?.username || "Guest"}</h3>
                  <p className="text-sm text-gray-500 truncate">@{profile?.username || "connect_wallet"}</p>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-bg-elevated p-3 rounded-lg text-center border border-purple-500/10">
                  <span className="block text-2xl font-display font-bold">{stats.wpmAvg || "—"}</span>
                  <span className="text-xs text-gray-500 uppercase font-bold">WPM Avg</span>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg text-center border border-purple-500/10">
                  <span className="block text-2xl font-display font-bold">{stats.wins || "—"}</span>
                  <span className="text-xs text-gray-500 uppercase font-bold">Wins</span>
                </div>
              </div>
              <Link href={profile ? "/game" : "/create-profile"} className="block w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-2.5 rounded-xl text-sm uppercase text-center hover:opacity-90 transition-all">
                Start Race
              </Link>
            </div>
          </aside>

          <div className="col-span-1 lg:col-span-6 space-y-6">
            <div id="compose" className={`bg-bg-card border rounded-xl p-4 relative overflow-hidden group focus-within:ring-1 focus-within:ring-purple-500/30 transition-all ${hasPending ? (pendingType === "flex" ? "border-pink-500/30" : "border-purple-500/30") : "border-purple-500/10"}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${hasPending ? (pendingType === "flex" ? "bg-pink-500" : "bg-purple-500") : "bg-purple-500/40"}`} />
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shrink-0">
                  {(profile?.username || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea value={postText} onChange={(e) => onPostTextChange(e.target.value)} placeholder="Share your latest race results or challenge someone..." className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 resize-none h-20 p-0 outline-none" rows={3} disabled={!profile} />

                  {pendingType === "flex" && pendingMeta.wpm != null && (
                    <ComposerFlexPreview wpm={pendingMeta.wpm} onCancel={onCancelPending} />
                  )}

                  {pendingType === "challenge" && (
                    <ComposerChallengePreview username={pendingMeta.challengerUsername || profile?.username || "you"} onCancel={onCancelPending} />
                  )}

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-purple-500/10">
                    <div className="flex gap-1 items-center">
                      <button type="button" onClick={onFlexWPM} disabled={!profile || pendingType === "flex"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "flex" ? "text-pink-400" : "text-gray-500 hover:text-pink-400"}`} title="Flex your WPM"><span className="material-icons text-base">emoji_events</span><span className="hidden sm:inline">Flex WPM</span></button>
                      <button type="button" onClick={onChallenge} disabled={!profile || pendingType === "challenge"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "challenge" ? "text-purple-400" : "text-gray-500 hover:text-purple-400"}`} title="Challenge someone"><span className="material-icons text-base">swords</span><span className="hidden sm:inline">Challenge</span></button>
                    </div>
                    <button type="button" onClick={onPost} disabled={!profile || !postText.trim() || posting} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-1 bg-bg-card p-1 rounded-xl border border-purple-500/10">
              {(["following", "top", "global"] as const).map((f) => (
                <button key={f} onClick={() => onFilterChange(f)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${filter === f ? "font-bold text-purple-300 bg-purple-500/15" : "text-gray-500 hover:bg-white/5"}`}>
                  {f === "top" ? "Top Posts" : f === "global" ? "Global" : "Following"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-bg-card rounded-xl p-12 text-center text-gray-500 border border-purple-500/10">Loading…</div>
            ) : (
              feedContent
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="text-xs text-gray-600 px-2">
              <span>&copy; 2026 KeySocial</span>
            </div>
          </aside>
        </div>
      </main>

      <button type="button" onClick={() => document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" })} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl shadow-glow-md flex items-center justify-center z-50 hover:scale-110 transition-transform" aria-label="New post">
        <span className="material-icons">edit</span>
      </button>
    </div>
  );
}

function ComposerFlexPreview({ wpm, onCancel }: { wpm: number; onCancel: () => void }) {
  const tier =
    wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 40 ? "Intermediate" : "Beginner";

  return (
    <div className="mt-2 rounded-lg border border-pink-500/30 bg-pink-500/5 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pink-500/15 flex items-center justify-center">
          <span className="material-icons text-pink-400">emoji_events</span>
        </div>
        <div>
          <div className="text-xs font-bold text-pink-400 uppercase">WPM Flex Card</div>
          <div className="font-display font-bold text-lg">{wpm} WPM <span className="text-xs font-normal text-gray-500">• {tier}</span></div>
        </div>
      </div>
    </div>
  );
}

function ComposerChallengePreview({ username, onCancel }: { username: string; onCancel: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <span className="material-icons text-purple-400">swords</span>
        </div>
        <div>
          <div className="text-xs font-bold text-purple-400 uppercase">Challenge Card</div>
          <div className="font-bold text-sm">@{username} is challenging you to a 1v1 race</div>
        </div>
      </div>
    </div>
  );
}
