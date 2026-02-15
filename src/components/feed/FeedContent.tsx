"use client";

import type { TapestryProfile } from "@/lib/tapestry";
import {
  FeedCardPost,
  FeedCardBotChallenge,
  BOT_CHALLENGES,
} from "./FeedCards";

interface LocalPost {
  id: string;
  author: string;
  handle: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = Date.now();
  const ms = now - d.getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)} mins ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)} hours ago`;
  if (ms < 604800000) return `${Math.floor(ms / 86400000)} days ago`;
  return d.toLocaleDateString();
}

interface FeedContentProps {
  localPosts: LocalPost[];
  profile: TapestryProfile | null;
  onDeletePost?: (postId: string) => void;
}

export function FeedContent({ localPosts, onDeletePost }: FeedContentProps) {
  return (
    <div className="space-y-6">
      {localPosts.map((post) => (
        <FeedCardPost
          key={post.id}
          postId={post.id}
          author={post.author}
          handle={post.handle}
          timeAgo={formatTimeAgo(post.createdAt)}
          content={post.content}
          likes={post.likes}
          comments={post.comments}
          onDelete={onDeletePost ? () => onDeletePost(post.id) : undefined}
        />
      ))}

      {BOT_CHALLENGES.map((bot) => (
        <FeedCardBotChallenge key={bot.id} bot={bot} />
      ))}
    </div>
  );
}
