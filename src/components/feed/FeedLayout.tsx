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
    <div className="min-h-screen bg-background text-text font-body">
      <AppHeader />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <Link href={profile ? `/profile/${profile.username}` : "#"} className="flex items-center gap-4 mb-4 group">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-black shrink-0 group-hover:ring-2 group-hover:ring-purple-300 transition-all">
                    {(profile?.username || "?")[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-lg leading-tight truncate text-gray-900 group-hover:text-purple-600 transition-colors">{profile?.username || "Guest"}</h3>
                  <p className="text-sm text-gray-500 truncate">@{profile?.username || "connect_wallet"}</p>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                  <span className="block text-2xl font-display font-bold text-gray-900">{stats.wpmAvg || "—"}</span>
                  <span className="text-xs text-gray-500 uppercase font-bold">WPM Avg</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                  <span className="block text-2xl font-display font-bold text-gray-900">{stats.wins || "—"}</span>
                  <span className="text-xs text-gray-500 uppercase font-bold">Wins</span>
                </div>
              </div>
              <Link href={profile ? "/game" : "/create-profile"} className="block w-full bg-purple-500 text-white font-bold py-2.5 rounded-lg text-sm uppercase text-center hover:bg-purple-600 transition-colors">
                Start Race
              </Link>
            </div>
          </aside>

          <div className="col-span-1 lg:col-span-6 space-y-6">
            <div id="compose" className={`bg-white border rounded-xl p-4 relative overflow-hidden group focus-within:ring-2 focus-within:ring-purple-500/20 transition-all ${hasPending ? (pendingType === "flex" ? "border-pink-300" : "border-purple-300") : "border-gray-200"}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${hasPending ? (pendingType === "flex" ? "bg-pink-500" : "bg-purple-500") : "bg-purple-500/40"}`} />
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {(profile?.username || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea value={postText} onChange={(e) => onPostTextChange(e.target.value)} placeholder="Share your latest race results or challenge someone..." className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 resize-none h-20 p-0 outline-none" rows={3} disabled={!profile} />

                  {pendingType === "flex" && pendingMeta.wpm != null && (
                    <ComposerFlexPreview wpm={pendingMeta.wpm} onCancel={onCancelPending} />
                  )}

                  {pendingType === "challenge" && (
                    <ComposerChallengePreview username={pendingMeta.challengerUsername || profile?.username || "you"} onCancel={onCancelPending} />
                  )}

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <div className="flex gap-1 items-center">
                      <button type="button" onClick={onFlexWPM} disabled={!profile || pendingType === "flex"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "flex" ? "text-pink-500" : "text-gray-500 hover:text-pink-500"}`} title="Flex your WPM"><span className="material-icons text-base">emoji_events</span><span className="hidden sm:inline">Flex WPM</span></button>
                      <button type="button" onClick={onChallenge} disabled={!profile || pendingType === "challenge"} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs font-medium disabled:opacity-40 ${pendingType === "challenge" ? "text-purple-500" : "text-gray-500 hover:text-purple-500"}`} title="Challenge someone"><span className="material-icons text-base">swords</span><span className="hidden sm:inline">Challenge</span></button>
                    </div>
                    <button type="button" onClick={onPost} disabled={!profile || !postText.trim() || posting} className="bg-purple-500 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {posting ? "Posting…" : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200">
              {(["global", "following", "top"] as const).map((f) => (
                <button key={f} onClick={() => onFilterChange(f)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${filter === f ? "font-bold text-purple-600 bg-purple-50 border-b-2 border-purple-500" : "text-gray-500 hover:bg-gray-50"}`}>
                  {f === "top" ? "Top Posts" : f === "global" ? "Global Feed" : "Following"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-gray-200">Loading…</div>
            ) : (
              feedContent
            )}
          </div>

          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="text-xs text-gray-400 px-2">
              <span>&copy; 2026 KeySocial</span>
            </div>
          </aside>
        </div>
      </main>

      <button type="button" onClick={() => document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" })} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-purple-500 text-white rounded-2xl shadow-lg flex items-center justify-center z-50 hover:bg-purple-600 hover:scale-110 transition-all" aria-label="New post">
        <span className="material-icons">edit</span>
      </button>
    </div>
  );
}

function ComposerFlexPreview({ wpm, onCancel }: { wpm: number; onCancel: () => void }) {
  const tier =
    wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 40 ? "Intermediate" : "Beginner";

  return (
    <div className="mt-2 rounded-lg border border-pink-200 bg-pink-50 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
          <span className="material-icons text-pink-500">emoji_events</span>
        </div>
        <div>
          <div className="text-xs font-bold text-pink-500 uppercase">WPM Flex Card</div>
          <div className="font-display font-bold text-lg text-gray-900">{wpm} WPM <span className="text-xs font-normal text-gray-500">• {tier}</span></div>
        </div>
      </div>
    </div>
  );
}

function ComposerChallengePreview({ username, onCancel }: { username: string; onCancel: () => void }) {
  return (
    <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-3 relative">
      <button type="button" onClick={onCancel} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors" title="Remove">
        <span className="material-icons text-base">close</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <span className="material-icons text-purple-500">swords</span>
        </div>
        <div>
          <div className="text-xs font-bold text-purple-500 uppercase">Challenge Card</div>
          <div className="font-bold text-sm text-gray-900">@{username} is challenging you to a 1v1 race</div>
        </div>
      </div>
    </div>
  );
}
