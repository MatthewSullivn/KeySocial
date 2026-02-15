"use client";

import { useEffect, useState, useCallback } from "react";
import { createContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
import { toast } from "sonner";
import { FeedLayout } from "./FeedLayout";
import { FeedContent } from "./FeedContent";

type FeedFilter = "following" | "top" | "global";

export type PendingPostType = "normal" | "flex" | "challenge";
export interface PendingMeta {
  wpm?: number;
  challengerUsername?: string;
}

export interface LocalPost {
  id: string;
  author: string;
  handle: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  postType?: PendingPostType;
  meta?: PendingMeta;
}

function loadLocalPosts(): LocalPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ks_local_posts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPosts(posts: LocalPost[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ks_local_posts", JSON.stringify(posts));
  } catch {}
}

function getBestWPM(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("ks_best_wpm");
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function loadStats(): { wpmAvg: number; wins: number } {
  if (typeof window === "undefined") return { wpmAvg: 0, wins: 0 };
  try {
    const raw = localStorage.getItem("ks_match_history");
    if (!raw) return { wpmAvg: 0, wins: 0 };
    const history = JSON.parse(raw) as Array<{
      winnerId: string;
      winnerWPM: number;
      loserWPM: number;
      loserId: string;
    }>;
    if (history.length === 0) return { wpmAvg: 0, wins: 0 };

    let totalWpm = 0;
    let wins = 0;
    const pid =
      useUserStore.getState().profile?.id ||
      useUserStore.getState().profile?.username ||
      "";

    for (const m of history) {
      const isWinner = m.winnerId === pid;
      totalWpm += isWinner ? m.winnerWPM : m.loserWPM;
      if (isWinner) wins++;
    }

    return {
      wpmAvg: history.length > 0 ? Math.round(totalWpm / history.length) : 0,
      wins,
    };
  } catch {
    return { wpmAvg: 0, wins: 0 };
  }
}

export default function FeedView() {
  const { profile } = useUserStore();
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("global");
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [pendingType, setPendingType] = useState<PendingPostType>("normal");
  const [pendingMeta, setPendingMeta] = useState<PendingMeta>({});
  const [stats, setStats] = useState({ wpmAvg: 0, wins: 0 });

  useEffect(() => {
    setLocalPosts(loadLocalPosts());
    setStats(loadStats());
    setLoading(false);
  }, []);

  const clearPending = useCallback(() => {
    setPendingType("normal");
    setPendingMeta({});
  }, []);

  const handlePost = useCallback(async () => {
    if (!profile || !postText.trim() || posting) return;
    setPosting(true);
    try {
      const newPost: LocalPost = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        author: profile.username || "You",
        handle: `@${profile.username || "user"}`,
        content: postText.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        postType: pendingType,
        meta: pendingType !== "normal" ? pendingMeta : undefined,
      };

      const updated = [newPost, ...localPosts];
      setLocalPosts(updated);
      saveLocalPosts(updated);
      setPostText("");
      clearPending();
      toast.success("Posted!");

      createContent(profile.id || profile.username, postText.trim()).catch(() => {});
    } catch (e) {
      toast.error("Failed to post");
      console.error(e);
    } finally {
      setPosting(false);
    }
  }, [profile, postText, posting, localPosts, pendingType, pendingMeta, clearPending]);

  const handleChallenge = useCallback(() => {
    if (!profile) return;
    const name = profile.username || "me";
    setPendingType("challenge");
    setPendingMeta({ challengerUsername: name });
    setPostText("Think you can type faster than me? Let's find out.");
    document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" });
  }, [profile]);

  const handleFlexWPM = useCallback(() => {
    if (!profile) return;
    const best = getBestWPM();
    if (best <= 0) {
      toast.error("Play a game first to set your personal best!");
      return;
    }
    setPendingType("flex");
    setPendingMeta({ wpm: best });
    setPostText("Check out my typing speed. Can anyone beat this?");
    document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" });
  }, [profile]);

  const handleCancelPending = useCallback(() => {
    clearPending();
    setPostText("");
  }, [clearPending]);

  const handleDeletePost = useCallback(
    (postId: string) => {
      const updated = localPosts.filter((p) => p.id !== postId);
      setLocalPosts(updated);
      saveLocalPosts(updated);
      toast.success("Post deleted");
    },
    [localPosts]
  );

  return (
    <FeedLayout
      profile={profile}
      filter={filter}
      onFilterChange={setFilter}
      postText={postText}
      onPostTextChange={(v) => {
        setPostText(v);
        if (!v.trim() && pendingType !== "normal") clearPending();
      }}
      onPost={handlePost}
      onChallenge={handleChallenge}
      onFlexWPM={handleFlexWPM}
      onCancelPending={handleCancelPending}
      pendingType={pendingType}
      pendingMeta={pendingMeta}
      posting={posting}
      loading={loading}
      stats={stats}
      feedContent={
        <FeedContent
          localPosts={localPosts}
          profile={profile}
          onDeletePost={handleDeletePost}
        />
      }
    />
  );
}
