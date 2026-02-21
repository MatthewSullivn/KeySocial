"use client";

import type { TapestryProfile } from "@/lib/tapestry";
import type { LocalPost } from "./FeedView";
import {
  FeedCardPost,
  FeedCardRaceResult,
  FeedCardBotChallenge,
  BOT_CHALLENGES,
} from "./FeedCards";

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

export function FeedContent({ localPosts, profile, onDeletePost }: FeedContentProps) {
  const currentUsername = profile?.username;
  return (
    <div className="space-y-6">
      {localPosts.map((post) =>
        post.postType === "match_result" && post.matchResult ? (
          <FeedCardRaceResult
            key={post.id}
            postId={post.id}
            timeAgo={formatTimeAgo(post.createdAt)}
            likes={post.likes}
            comments={post.comments}
            hasLiked={post.hasLiked}
            winnerUsername={post.matchResult.winnerUsername}
            loserUsername={post.matchResult.loserUsername}
            winnerWPM={post.matchResult.winnerWPM}
            loserWPM={post.matchResult.loserWPM}
            winnerAccuracy={post.matchResult.winnerAccuracy}
            loserAccuracy={post.matchResult.loserAccuracy}
            stakeAmount={post.matchResult.stakeAmount}
          />
        ) : (
          <FeedCardPost
            key={post.id}
            postId={post.id}
            author={post.author}
            handle={post.handle}
            timeAgo={formatTimeAgo(post.createdAt)}
            content={post.content}
            likes={post.likes}
            comments={post.comments}
            hasLiked={post.hasLiked}
            onDelete={onDeletePost && currentUsername && post.author === currentUsername ? () => onDeletePost(post.id) : undefined}
            postType={post.postType}
            meta={post.meta}
          />
        )
      )}

      {BOT_CHALLENGES.map((bot) => (
        <FeedCardBotChallenge key={bot.id} bot={bot} />
      ))}
    </div>
  );
}
