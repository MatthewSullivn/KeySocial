"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";
import {
  likeContent,
  unlikeContent,
  createComment,
  getComments,
  deleteComment,
  type TapestryComment,
} from "@/lib/tapestry";
import { toast } from "sonner";

interface DisplayComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface SocialActionsProps {
  postId: string;
  initialLikes: number;
  initialComments: number;
  initialHasLiked?: boolean;
  showRepost?: boolean;
  showShare?: boolean;
}

export function SocialActions({
  postId,
  initialLikes,
  initialComments,
  initialHasLiked = false,
  showRepost = false,
  showShare = false,
}: SocialActionsProps) {
  const { profile } = useUserStore();
  const [liked, setLiked] = useState(initialHasLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUsername = profile?.username;

  const loadComments = useCallback(async () => {
    try {
      const tapestryComments = await getComments(postId, 50, 0);
      const mapped: DisplayComment[] = tapestryComments.map((c: TapestryComment) => ({
        id: c.id,
        author: c.profile?.username || c.profileId || "Unknown",
        text: c.text,
        createdAt: c.createdAt || new Date().toISOString(),
      }));
      setComments(mapped);
      setCommentsLoaded(true);
    } catch {
      setCommentsLoaded(true);
    }
  }, [postId]);

  useEffect(() => {
    if (commentsOpen && !commentsLoaded) {
      loadComments();
    }
  }, [commentsOpen, commentsLoaded, loadComments]);

  function handleLike() {
    const profileId = profile?.id || profile?.username;
    if (!profileId) return;

    if (liked) {
      const newCount = Math.max(0, likeCount - 1);
      setLiked(false);
      setLikeCount(newCount);
      unlikeContent(postId, profileId).catch(() => {});
    } else {
      const newCount = likeCount + 1;
      setLiked(true);
      setLikeCount(newCount);
      likeContent(postId, profileId).catch(() => {});
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
    const profileId = profile?.id || profile?.username;
    if (!profileId) return;

    setSubmitting(true);
    try {
      await createComment(profileId, postId, commentText.trim());
      setCommentText("");
      toast.success("Comment added!");
      await loadComments();
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const backup = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    try {
      await deleteComment(commentId);
      toast.success("Comment deleted");
    } catch {
      setComments(backup);
      toast.error("Failed to delete comment");
    }
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
      <div className="flex items-center gap-6 text-gray-400">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors group ${liked ? "text-pink-500" : "hover:text-pink-500"}`}
        >
          <span className="material-icons text-xl group-hover:scale-110 transition-transform">
            {liked ? "favorite" : "favorite_border"}
          </span>
          <span className="text-sm font-medium">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleToggleComments}
          className={`flex items-center gap-2 transition-colors group ${commentsOpen ? "text-purple-500" : "hover:text-purple-500"}`}
        >
          <span className="material-icons text-xl group-hover:scale-110 transition-transform">
            {commentsOpen ? "chat_bubble" : "chat_bubble_outline"}
          </span>
          <span className="text-sm font-medium">{commentsOpen ? comments.length : initialComments}</span>
        </button>
        {showRepost && (
          <button type="button" className="flex items-center gap-2 hover:text-teal-500 transition-colors group">
            <span className="material-icons text-xl group-hover:scale-110 transition-transform">repeat</span>
            <span className="text-sm font-medium">0</span>
          </button>
        )}
        {showShare && (
          <button type="button" className="flex items-center gap-2 hover:text-gray-600 transition-colors ml-auto">
            <span className="material-icons text-xl">share</span>
          </button>
        )}
      </div>

      {commentsOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {!commentsLoaded && (
            <p className="text-sm text-gray-500 text-center py-2">Loading comments...</p>
          )}
          {commentsLoaded && comments.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {comments.map((c, idx) => (
                <div key={c.id || `comment-${idx}`} className="flex gap-3 group/comment">
                  <Link href={`/profile/${c.author}`} className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 shrink-0 hover:ring-2 hover:ring-purple-300 transition-all">
                    {c.author[0]?.toUpperCase()}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${c.author}`} className="font-bold text-sm text-gray-900 hover:text-purple-600 transition-colors">{c.author}</Link>
                      <span className="text-xs text-gray-400">{formatTime(c.createdAt)}</span>
                      {currentUsername && c.author === currentUsername && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-auto p-0.5 rounded hover:bg-red-50"
                          title="Delete comment"
                        >
                          <span className="material-icons text-base">delete</span>
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {commentsLoaded && comments.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">No comments yet. Be the first!</p>
          )}
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
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
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={handleSubmitComment}
              disabled={!profile || !commentText.trim() || submitting}
              className="bg-purple-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
