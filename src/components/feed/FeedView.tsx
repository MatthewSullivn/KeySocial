"use client";

import { useEffect, useState, useCallback } from "react";
import { createContent } from "@/lib/tapestry";
import { useUserStore } from "@/store/user-store";
import { toast } from "sonner";
import { FeedLayout } from "./FeedLayout";
import { FeedContent } from "./FeedContent";

type FeedFilter = "following" | "top" | "global";

interface LocalPost {
  id: string;
  author: string;
  handle: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
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

export default function FeedView() {
  const { profile } = useUserStore();
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>("global");
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLocalPosts(loadLocalPosts());
    setLoading(false);
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
      };

      const updated = [newPost, ...localPosts];
      setLocalPosts(updated);
      saveLocalPosts(updated);
      setPostText("");
      toast.success("Posted!");

      createContent(profile.id || profile.username, postText.trim()).catch(() => {});
    } catch (e) {
      toast.error("Failed to post");
      console.error(e);
    } finally {
      setPosting(false);
    }
  }, [profile, postText, posting, localPosts]);

  const handleChallenge = useCallback(() => {
    if (!profile) return;
    const name = profile.username || "me";
    setPostText(`⚔️ I'm challenging anyone to a typing race! Think you can beat @${name}? Meet me in the lobby. Let's go! 🏁`);
    document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" });
  }, [profile]);

  const handleFlexWPM = useCallback(() => {
    if (!profile) return;
    const best = getBestWPM();
    if (best > 0) {
      setPostText(`🏆 Personal Best: ${best} WPM! Can anyone on KeySocial beat that? Drop your best below. #SpeedTyping #KeySocial`);
    } else {
      setPostText(`🏆 Just warming up on KeySocial! About to set my personal best WPM. Who wants to race? #SpeedTyping #KeySocial`);
    }
    document.getElementById("compose")?.scrollIntoView({ behavior: "smooth" });
  }, [profile]);

  const handleDeletePost = useCallback((postId: string) => {
    const updated = localPosts.filter((p) => p.id !== postId);
    setLocalPosts(updated);
    saveLocalPosts(updated);
    toast.success("Post deleted");
  }, [localPosts]);

  return (
    <FeedLayout
      profile={profile}
      filter={filter}
      onFilterChange={setFilter}
      postText={postText}
      onPostTextChange={setPostText}
      onPost={handlePost}
      onChallenge={handleChallenge}
      onFlexWPM={handleFlexWPM}
      posting={posting}
      loading={loading}
      feedContent={<FeedContent localPosts={localPosts} profile={profile} onDeletePost={handleDeletePost} />}
    />
  );
}
