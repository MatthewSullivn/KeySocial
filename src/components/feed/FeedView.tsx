"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createContent, getContents, getFollowing, deleteContent, type TapestryContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
import { toast } from "sonner";
import { FeedLayout } from "./FeedLayout";
import { FeedContent } from "./FeedContent";

type FeedFilter = "following" | "top" | "global";

export type PendingPostType = "normal" | "flex" | "challenge" | "match_result";
export interface PendingMeta {
  wpm?: number;
  challengerUsername?: string;
  roomCode?: string;
  challengedUsername?: string;
}

export interface MatchResultData {
  winnerUsername: string;
  loserUsername: string;
  winnerWPM: number;
  loserWPM: number;
  winnerAccuracy: number;
  loserAccuracy: number;
  stakeAmount: number;
}

export interface LocalPost {
  id: string;
  author: string;
  handle: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  hasLiked?: boolean;
  postType?: PendingPostType;
  meta?: PendingMeta;
  matchResult?: MatchResultData;
}

function tapestryContentToLocalPost(tc: TapestryContent): LocalPost | null {
  const isMatch = tc.properties?.type === "match_result";

  if (isMatch) {
    const p = tc.properties!;
    return {
      id: tc.id,
      author: p.winnerUsername || tc.profile?.username || "Racer",
      handle: `@${p.winnerUsername || tc.profile?.username || "racer"}`,
      content: tc.content || "",
      createdAt: tc.createdAt || new Date().toISOString(),
      likes: tc.socialCounts?.likes || 0,
      comments: tc.socialCounts?.comments || 0,
      hasLiked: tc.hasLiked || false,
      postType: "match_result",
      matchResult: {
        winnerUsername: p.winnerUsername || "Unknown",
        loserUsername: p.loserUsername || "Unknown",
        winnerWPM: parseInt(p.winnerWPM || "0"),
        loserWPM: parseInt(p.loserWPM || "0"),
        winnerAccuracy: parseInt(p.winnerAccuracy || "0"),
        loserAccuracy: parseInt(p.loserAccuracy || "0"),
        stakeAmount: parseFloat(p.stakeAmount || "0"),
      },
    };
  }

  const text = tc.content || tc.properties?.text || "";
  if (!text.trim()) return null;

  const postType = (tc.properties?.postType as PendingPostType) || "normal";
  const meta: PendingMeta = {};
  if (tc.properties?.wpm) meta.wpm = parseInt(tc.properties.wpm, 10);
  if (tc.properties?.challengerUsername) meta.challengerUsername = tc.properties.challengerUsername;
  if (tc.properties?.roomCode) meta.roomCode = tc.properties.roomCode;
  if (tc.properties?.challengedUsername) meta.challengedUsername = tc.properties.challengedUsername;

  return {
    id: tc.id,
    author: tc.profile?.username || tc.profileId || "Unknown",
    handle: `@${tc.profile?.username || tc.profileId || "unknown"}`,
    content: text,
    createdAt: tc.createdAt || new Date().toISOString(),
    likes: tc.socialCounts?.likes || 0,
    comments: tc.socialCounts?.comments || 0,
    hasLiked: tc.hasLiked || false,
    postType,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
}

function computeStatsFromContents(
  contents: TapestryContent[],
  profileId: string
): { wpmAvg: number; wins: number; bestWpm: number } {
  let totalWpm = 0;
  let matchCount = 0;
  let wins = 0;
  let bestWpm = 0;

  // Deduplicate matches with same winner+loser+WPM within 5 seconds
  const seen = new Set<string>();
  for (const tc of contents) {
    if (tc.properties?.type !== "match_result") continue;
    const pr = tc.properties;
    const ts = tc.createdAt ? Math.floor(new Date(tc.createdAt).getTime() / 5000) : "";
    const key = `${pr.winnerId}-${pr.loserId}-${pr.winnerWPM}-${pr.loserWPM}-${ts}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matchCount++;
    const isWinner = pr.winnerId === profileId;
    const wpm = parseInt(isWinner ? pr.winnerWPM : pr.loserWPM, 10) || 0;
    totalWpm += wpm;
    if (isWinner) wins++;
    if (wpm > bestWpm) bestWpm = wpm;
  }

  return {
    wpmAvg: matchCount > 0 ? Math.round(totalWpm / matchCount) : 0,
    wins,
    bestWpm,
  };
}

export default function FeedView() {
  const { profile } = useUserStore();
  const [posts, setPosts] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("global");
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [pendingType, setPendingType] = useState<PendingPostType>("normal");
  const [pendingMeta, setPendingMeta] = useState<PendingMeta>({});
  const [stats, setStats] = useState({ wpmAvg: 0, wins: 0 });
  const [bestWpm, setBestWpm] = useState(0);

  const followingSetRef = useRef<Set<string> | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const pid = profile?.id || profile?.username || "";
      const contents = await getContents(50, 0, pid || undefined);
      const computed = computeStatsFromContents(contents, pid);
      setStats({ wpmAvg: computed.wpmAvg, wins: computed.wins });
      setBestWpm(computed.bestWpm);

      // Convert posts (non-match-result content)
      const converted = contents
        .map(tapestryContentToLocalPost)
        .filter((p): p is LocalPost => p !== null);
      setPosts(converted);
    } catch (err) {
      console.error("Failed to load posts from API:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Fetch following list when switching to "following" filter
  useEffect(() => {
    if (filter !== "following" || !profile) return;
    const pid = profile.id || profile.username;
    if (!pid) return;
    getFollowing(pid, 200, 0)
      .then((list) => {
        const set = new Set(list.map((p) => p.username).filter(Boolean));
        followingSetRef.current = set;
        // Force re-render by bumping posts
        setPosts((prev) => [...prev]);
      })
      .catch(() => {});
  }, [filter, profile]);

  const filteredPosts = useMemo(() => {
    if (filter === "following") {
      const set = followingSetRef.current;
      if (!set) return [];
      return posts.filter((p) => set.has(p.author));
    }
    if (filter === "top") {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    return posts;
  }, [posts, filter]);

  const clearPending = useCallback(() => {
    setPendingType("normal");
    setPendingMeta({});
  }, []);

  const handlePost = useCallback(async () => {
    if (!profile || !postText.trim() || posting) return;
    setPosting(true);
    try {
      const profileId = profile.id || profile.username;

      const extraProps: { key: string; value: string }[] = [];
      if (pendingType !== "normal") {
        extraProps.push({ key: "postType", value: pendingType });
      }
      if (pendingMeta.wpm != null) {
        extraProps.push({ key: "wpm", value: String(pendingMeta.wpm) });
      }
      if (pendingMeta.challengerUsername) {
        extraProps.push({ key: "challengerUsername", value: pendingMeta.challengerUsername });
      }
      if (pendingMeta.roomCode) {
        extraProps.push({ key: "roomCode", value: pendingMeta.roomCode });
      }
      if (pendingMeta.challengedUsername) {
        extraProps.push({ key: "challengedUsername", value: pendingMeta.challengedUsername });
      }

      await createContent(profileId, postText.trim(), "text", extraProps);

      setPostText("");
      clearPending();
      toast.success("Posted!");

      await loadPosts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(`Failed to post: ${msg}`);
      console.error("Post error:", e);
    } finally {
      setPosting(false);
    }
  }, [profile, postText, posting, pendingType, pendingMeta, clearPending, loadPosts]);

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
    if (bestWpm <= 0) {
      toast.error("Play a game first to set your personal best!");
      return;
    }
    setPendingType("flex");
    setPendingMeta({ wpm: bestWpm });
    setPostText("Check out my typing speed. Can anyone beat this?");
    document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" });
  }, [profile, bestWpm]);

  const handleCancelPending = useCallback(() => {
    clearPending();
    setPostText("");
  }, [clearPending]);

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const backup = posts;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      try {
        await deleteContent(postId);
        toast.success("Post deleted");
      } catch {
        setPosts(backup);
        toast.error("Failed to delete post");
      }
    },
    [posts]
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
          localPosts={filteredPosts}
          profile={profile}
          onDeletePost={handleDeletePost}
        />
      }
    />
  );
}
