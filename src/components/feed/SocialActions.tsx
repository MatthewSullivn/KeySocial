"use client";

import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/store/user-store";
import { likeContent, unlikeContent, createComment } from "@/lib/tapestry";
import { toast } from "sonner";

interface LocalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

function loadLikedMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("ks_liked_posts_v2");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLikedMap(m: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ks_liked_posts_v2", JSON.stringify(m));
  } catch {}
}

function loadLocalComments(postId: string): LocalComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`ks_comments_${postId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalComments(postId: string, comments: LocalComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`ks_comments_${postId}`, JSON.stringify(comments));
  } catch {}
}

interface SocialActionsProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  showRepost?: boolean;
  showShare?: boolean;
}

export function SocialActions({
  postId,
  initialLikes,
  initialComments,
  showRepost = false,
  showShare = false,
}: SocialActionsProps) {
  const { profile } = useUserStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<LocalComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const likedMap = loadLikedMap();
    if (postId in likedMap) {
      setLiked(true);
      setLikeCount(likedMap[postId]);
    }
    setComments(loadLocalComments(postId));
  }, [postId]);

  const totalComments = initialComments + comments.length;
  const currentUsername = profile?.username;

  function handleLike() {
    const profileId = profile?.id || profile?.username;
    const likedMap = loadLikedMap();

    if (liked) {
      const newCount = Math.max(0, likeCount - 1);
      setLiked(false);
      setLikeCount(newCount);
      delete likedMap[postId];
      saveLikedMap(likedMap);
      if (profileId) {
        unlikeContent(postId, profileId).catch(() => {});
      }
    } else {
      const newCount = likeCount + 1;
      setLiked(true);
      setLikeCount(newCount);
      likedMap[postId] = newCount;
      saveLikedMap(likedMap);
      if (profileId) {
        likeContent(postId, profileId).catch(() => {});
      }
    }
  }

  function handleToggleComments() {
    setCommentsOpen((o) => !o);
    if (!commentsOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleSubmitComment() {
    if (!commentText.trim() || submitting) return;
    const author = profile?.username || "You";
    const profileId = profile?.id || profile?.username;

    setSubmitting(true);
    const newComment: LocalComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...comments, newComment];
    setComments(updated);
    saveLocalComments(postId, updated);
    setCommentText("");
    toast.success("Comment added!");

    if (profileId) {
      createComment(profileId, postId, newComment.text).catch(() => {});
    }
    setSubmitting(false);
  }

  function handleDeleteComment(commentId: string) {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    saveLocalComments(postId, updated);
    toast.success("Comment deleted");
  }

  function formatTime(dateStr: string) {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60000) return "just now";
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-6 text-slate-500">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors group ${liked ? "text-accent-pink" : "hover:text-accent-pink"}`}
        >
          <span className="material-icons text-xl group-hover:scale-110 transition-transform">
            {liked ? "favorite" : "favorite_border"}
          </span>
          <span className="text-sm font-medium">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className={`flex items-center gap-2 transition-colors group ${commentsOpen ? "text-accent-blue" : "hover:text-accent-blue"}`}
        >
          <span className="material-icons text-xl group-hover:scale-110 transition-transform">
            {commentsOpen ? "chat_bubble" : "chat_bubble_outline"}
          </span>
          <span className="text-sm font-medium">{totalComments}</span>
        </button>
        {showRepost && (
          <button type="button" className="flex items-center gap-2 hover:text-accent-teal transition-colors group">
            <span className="material-icons text-xl group-hover:scale-110 transition-transform">repeat</span>
            <span className="text-sm font-medium">0</span>
          </button>
        )}
        {showShare && (
          <button type="button" className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors ml-auto">
            <span className="material-icons text-xl">share</span>
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {comments.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 group/comment">
                  <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    {c.author[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{c.author}</span>
                      <span className="text-xs text-slate-400">{formatTime(c.createdAt)}</span>
                      {currentUsername && c.author === currentUsername && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors ml-auto p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete comment"
                        >
                          <span className="material-icons text-base">delete</span>
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {comments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-2">No comments yet. Be the first!</p>
          )}
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-xs font-bold text-slate-900 shrink-0">
              {(profile?.username || "?")[0]?.toUpperCase()}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
              placeholder={profile ? "Write a comment..." : "Connect wallet to comment"}
              disabled={!profile || submitting}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!profile || !commentText.trim() || submitting}
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
