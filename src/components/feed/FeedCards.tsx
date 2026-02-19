"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { TapestryContent, TapestryProfile } from "@/lib/tapestry";
import { SocialActions } from "./SocialActions";

function PostMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-gray-500 hover:text-white p-1 transition-colors"
      >
        <span className="material-icons">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-bg-card border border-purple-500/15 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span className="material-icons text-base">delete</span>
            Delete Post
          </button>
        </div>
      )}
    </div>
  );
}

export interface BotChallenge {
  id: string;
  botName: string;
  difficulty: "easy" | "medium" | "hard";
  wpm: number;
  message: string;
  icon: string;
  accentColor: string;
  bgColor: string;
}

export const BOT_CHALLENGES: BotChallenge[] = [
  {
    id: "bot-easy",
    botName: "Easy Bot",
    difficulty: "easy",
    wpm: 30,
    message: "Hey there! I type at a chill 30 WPM. Perfect if you're warming up or just getting started. Think you can beat me? Let's go!",
    icon: "sports_esports",
    accentColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "bot-medium",
    botName: "Medium Bot",
    difficulty: "medium",
    wpm: 60,
    message: "I type at a solid 60 WPM. Not too fast, not too slow. Ready to test your skills against a real challenge? Bring it on!",
    icon: "local_fire_department",
    accentColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "bot-hard",
    botName: "Hard Bot",
    difficulty: "hard",
    wpm: 100,
    message: "100 WPM. No mercy. Only the fastest typists survive against me. Do you have what it takes, or will you crumble under pressure?",
    icon: "bolt",
    accentColor: "text-purple-300",
    bgColor: "bg-purple-400/10",
  },
];

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

export function FeedCardFromContent({ content, profile }: { content: TapestryContent; profile: TapestryProfile | null }) {
  const props = content.properties || {};
  const isMatch = props.type === "match_result";

  if (isMatch) {
    return (
      <FeedCardRaceResult
        postId={content.id}
        author={props.winnerUsername || "Racer"}
        handle={`@${(props.winnerId || "").slice(0, 12)}`}
        timeAgo={content.createdAt ? formatTimeAgo(content.createdAt) : "—"}
        raceId={`#${content.id?.slice(-4) || "—"}`}
        content={content.content}
        wpm={parseInt(props.winnerWPM || "0")}
        accuracy={parseFloat(props.winnerAccuracy || "0")}
        hash={content.id ? `${content.id.slice(0, 4)}...${content.id.slice(-4)}` : "—"}
        likes={content.socialCounts?.likes ?? 0}
        comments={content.socialCounts?.comments ?? 0}
      />
    );
  }

  return (
    <FeedCardPost
      postId={content.id}
      author={content.profile?.username || "Anonymous"}
      handle={`@${content.profile?.username || content.profileId?.slice(0, 8) || "—"}`}
      timeAgo={content.createdAt ? formatTimeAgo(content.createdAt) : "—"}
      content={content.content}
      likes={content.socialCounts?.likes ?? 0}
      comments={content.socialCounts?.comments ?? 0}
    />
  );
}

export function FeedCardRaceResult({
  postId, author, timeAgo, raceId, content, wpm, accuracy, hash, likes, comments,
}: {
  postId: string; author: string; handle: string; timeAgo: string; raceId: string;
  content: string; wpm: number; accuracy: number; hash: string; likes: number; comments: number;
}) {
  return (
    <div className="bg-bg-card border-l-4 border-l-pink-500 border border-purple-500/10 rounded-xl p-5">
      <div className="flex gap-4">
        <Link href={`/profile/${author}`} className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shrink-0 hover:shadow-glow-sm transition-all">
          {author[0]?.toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><Link href={`/profile/${author}`} className="font-display font-bold text-lg hover:text-purple-400 transition-colors">{author}</Link><p className="text-xs text-gray-500">{timeAgo} • {raceId}</p></div>
            <button type="button" className="text-gray-500 hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
          </div>
          <p className="mt-3 text-gray-300 leading-relaxed">{content}</p>
          <div className="mt-4 bg-bg-elevated border border-purple-500/10 rounded-xl p-4 relative">
            <div className="absolute top-2 right-2 text-pink-400"><span className="material-icons text-3xl">emoji_events</span></div>
            <h5 className="font-display font-bold text-xl">New Personal Best!</h5>
            <div className="flex items-end gap-6 mt-4">
              <div><span className="text-xs uppercase font-bold text-gray-500 block mb-1">Speed</span><span className="text-3xl font-black">{wpm} <span className="text-sm font-normal text-gray-500">WPM</span></span></div>
              <div><span className="text-xs uppercase font-bold text-gray-500 block mb-1">Accuracy</span><span className="text-3xl font-black">{accuracy}<span className="text-sm font-normal text-gray-500">%</span></span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-500/10 flex justify-between items-center">
              <span className="text-xs font-mono text-gray-500">Hash: {hash}</span>
              <Link href="/game" className="text-xs font-bold text-purple-400 hover:underline flex items-center">View Race Replay <span className="material-icons text-sm ml-1">play_circle</span></Link>
            </div>
          </div>
          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} showRepost showShare />
        </div>
      </div>
    </div>
  );
}

export function FeedCardPost({
  postId, author, timeAgo, content, likes, comments, hasLiked, onDelete, postType, meta,
}: {
  postId: string; author: string; handle: string; timeAgo: string; content: string;
  likes: number; comments: number; hasLiked?: boolean; onDelete?: () => void;
  postType?: "normal" | "flex" | "challenge"; meta?: { wpm?: number; challengerUsername?: string };
}) {
  const borderColor =
    postType === "flex"
      ? "border-l-pink-500"
      : postType === "challenge"
      ? "border-l-purple-400"
      : "border-l-purple-500/40";

  return (
    <div className={`bg-bg-card border-l-4 ${borderColor} border border-purple-500/10 rounded-xl p-5`}>
      <div className="flex gap-4">
        <Link href={`/profile/${author}`} className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shrink-0 hover:shadow-glow-sm transition-all">
          {author[0]?.toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><Link href={`/profile/${author}`} className="font-display font-bold text-lg hover:text-purple-400 transition-colors">{author}</Link><p className="text-xs text-gray-500">{timeAgo}</p></div>
            {onDelete ? (
              <PostMenu onDelete={onDelete} />
            ) : (
              <button type="button" className="text-gray-500 hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
            )}
          </div>
          <p className="mt-3 text-gray-300 leading-relaxed whitespace-pre-wrap">{content}</p>

          {postType === "flex" && meta?.wpm != null && (
            <WpmFlexBlock wpm={meta.wpm} author={author} />
          )}

          {postType === "challenge" && (
            <ChallengeBlock challengerUsername={meta?.challengerUsername || author} />
          )}

          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} initialHasLiked={hasLiked} showShare />
        </div>
      </div>
    </div>
  );
}

function WpmFlexBlock({ wpm, author }: { wpm: number; author: string }) {
  const tier = wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 40 ? "Intermediate" : "Beginner";
  const tierColor = wpm >= 100 ? "text-purple-300" : wpm >= 70 ? "text-pink-400" : wpm >= 40 ? "text-pink-300" : "text-purple-400";
  const tierBg = wpm >= 100 ? "bg-purple-400/15" : wpm >= 70 ? "bg-pink-500/15" : wpm >= 40 ? "bg-pink-400/15" : "bg-purple-500/15";

  return (
    <div className="mt-4 rounded-xl border border-purple-500/15 overflow-hidden">
      <div className="bg-bg-elevated p-5 relative">
        <div className="absolute top-3 right-3 opacity-10">
          <span className="material-icons text-6xl text-purple-400">speed</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons text-purple-400 text-lg">emoji_events</span>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Personal Best</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tierBg} ${tierColor} ml-auto`}>{tier}</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-5xl font-black text-white font-display">{wpm}</span>
            <span className="text-lg font-bold text-gray-500 ml-1">WPM</span>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-bg-card rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                style={{ width: `${Math.min(100, (wpm / 150) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-600">0</span>
              <span className="text-[10px] text-gray-600">150</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-purple-500/10 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            <span className="font-bold text-gray-300">@{author}</span> on KeySocial
          </span>
          <Link href="/game" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
            Beat this <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChallengeBlock({ challengerUsername }: { challengerUsername: string }) {
  return (
    <div className="mt-4 rounded-xl border border-purple-500/15 overflow-hidden">
      <div className="bg-bg-elevated p-5 relative">
        <div className="absolute top-3 right-3 opacity-10">
          <span className="material-icons text-6xl text-purple-400">swords</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons text-purple-400 text-lg">swords</span>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Open Challenge</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-white text-xl font-black shrink-0">
            {challengerUsername[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-white text-lg">@{challengerUsername}</h5>
            <p className="text-sm text-gray-400">wants to race you in a 1v1 typing duel</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-bg-card rounded-lg p-2">
            <span className="material-icons text-base text-accent-teal">timer</span>
            <span className="block text-xs text-gray-500 mt-0.5">Real-time</span>
          </div>
          <div className="bg-bg-card rounded-lg p-2">
            <span className="material-icons text-base text-pink-400">group</span>
            <span className="block text-xs text-gray-500 mt-0.5">1v1</span>
          </div>
          <div className="bg-bg-card rounded-lg p-2">
            <span className="material-icons text-base text-purple-400">bolt</span>
            <span className="block text-xs text-gray-500 mt-0.5">Any Skill</span>
          </div>
        </div>
        <Link href={`/game?mode=create`} className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all">
          <span className="material-icons text-lg">play_arrow</span>
          Accept Challenge (Create Room)
        </Link>
      </div>
    </div>
  );
}

export function FeedCardBotChallenge({ bot }: { bot: BotChallenge }) {
  const diffLabel = bot.difficulty === "easy" ? "Casual" : bot.difficulty === "medium" ? "Ranked" : "Elite";

  return (
    <div className="bg-bg-card border-l-4 border-l-purple-500/40 border border-purple-500/10 rounded-xl p-5">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-xl ${bot.bgColor} flex items-center justify-center shrink-0 border border-purple-500/15`}>
          <span className={`material-icons text-xl ${bot.accentColor}`}>{bot.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-display font-bold text-lg flex items-center gap-2">
                {bot.botName}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${bot.bgColor} ${bot.accentColor}`}>{diffLabel}</span>
              </h4>
              <p className="text-xs text-gray-500">Bot • {bot.wpm} WPM</p>
            </div>
            <span className={`material-icons text-2xl ${bot.accentColor}`}>smart_toy</span>
          </div>
          <p className="mt-3 text-gray-300 leading-relaxed">{bot.message}</p>
          <Link href={`/game?mode=bot&difficulty=${bot.difficulty}`} className="mt-4 block bg-bg-elevated text-white rounded-xl p-4 hover:bg-bg-hover transition-colors group border border-purple-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${bot.bgColor} p-2 rounded-lg`}>
                  <span className={`material-icons ${bot.accentColor}`}>swords</span>
                </div>
                <div>
                  <h6 className="font-bold text-sm">Challenge {bot.botName}</h6>
                  <p className="text-xs text-gray-400">{diffLabel} • {bot.wpm} WPM • Free Practice</p>
                </div>
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Race Now</span>
            </div>
          </Link>
          <SocialActions postId={bot.id} initialLikes={0} initialComments={0} />
        </div>
      </div>
    </div>
  );
}
