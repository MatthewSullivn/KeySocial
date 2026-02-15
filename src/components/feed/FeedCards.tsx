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
        className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
      >
        <span className="material-icons">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
    message: "Hey there! I type at a chill 30 WPM. Perfect if you're warming up or just getting started. Think you can beat me? Let's go! 🐢",
    icon: "sports_esports",
    accentColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "bot-medium",
    botName: "Medium Bot",
    difficulty: "medium",
    wpm: 60,
    message: "I type at a solid 60 WPM. Not too fast, not too slow. Ready to test your skills against a real challenge? Bring it on! 🔥",
    icon: "local_fire_department",
    accentColor: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    id: "bot-hard",
    botName: "Hard Bot",
    difficulty: "hard",
    wpm: 100,
    message: "100 WPM. No mercy. Only the fastest typists survive against me. Do you have what it takes, or will you crumble under pressure? ⚡",
    icon: "bolt",
    accentColor: "text-accent-purple",
    bgColor: "bg-accent-purple/10",
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
  postId,
  author,
  timeAgo,
  raceId,
  content,
  wpm,
  accuracy,
  hash,
  likes,
  comments,
}: {
  postId: string;
  author: string;
  handle: string;
  timeAgo: string;
  raceId: string;
  content: string;
  wpm: number;
  accuracy: number;
  hash: string;
  likes: number;
  comments: number;
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border-l-4 border-l-accent-pink border-y border-r border-y-slate-200 dark:border-y-slate-700 border-r-slate-200 dark:border-r-slate-700 rounded-xl p-5 shadow-sm pop-card">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
          {author[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><h4 className="font-display font-bold text-lg">{author}</h4><p className="text-xs text-slate-500">{timeAgo} • {raceId}</p></div>
            <button type="button" className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
          </div>
          <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">{content}</p>
          <div className="mt-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 border-2 border-slate-900 dark:border-slate-600 rounded-xl p-4 relative">
            <div className="absolute top-2 right-2 text-accent-pink"><span className="material-icons text-3xl">emoji_events</span></div>
            <h5 className="font-display font-bold text-slate-900 dark:text-white text-xl">New Personal Best!</h5>
            <div className="flex items-end gap-6 mt-4">
              <div><span className="text-xs uppercase font-bold text-slate-500 block mb-1">Speed</span><span className="text-3xl font-black text-slate-900 dark:text-white">{wpm} <span className="text-sm font-normal text-slate-500">WPM</span></span></div>
              <div><span className="text-xs uppercase font-bold text-slate-500 block mb-1">Accuracy</span><span className="text-3xl font-black text-slate-900 dark:text-white">{accuracy}<span className="text-sm font-normal text-slate-500">%</span></span></div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <span className="text-xs font-mono text-slate-500">Hash: {hash}</span>
              <Link href="/game" className="text-xs font-bold text-slate-900 dark:text-white hover:underline flex items-center">View Race Replay <span className="material-icons text-sm ml-1">play_circle</span></Link>
            </div>
          </div>
          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} showRepost showShare />
        </div>
      </div>
    </div>
  );
}

export function FeedCardLobby({
  postId,
  author,
  timeAgo,
  content,
  entrySol,
  likes,
  comments,
}: {
  postId: string;
  author: string;
  handle: string;
  timeAgo: string;
  content: string;
  entrySol: number;
  likes: number;
  comments: number;
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border-l-4 border-l-accent-blue border-y border-r border-y-slate-200 dark:border-y-slate-700 border-r-slate-200 dark:border-r-slate-700 rounded-xl p-5 shadow-sm pop-card">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
          {author[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><h4 className="font-display font-bold text-lg">{author}</h4><p className="text-xs text-slate-500">{timeAgo}</p></div>
            <button type="button" className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
          </div>
          <p className="mt-3 text-slate-700 dark:text-slate-300">{content}</p>
          <Link href="/match" className="mt-4 block bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-4 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent-blue p-2 rounded-lg"><span className="material-icons text-white">casino</span></div>
                <div><h6 className="font-bold text-sm">High Stakes Lobby</h6><p className="text-xs text-slate-300">Entry: {entrySol} SOL • 1v1</p></div>
              </div>
              <span className="bg-primary text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-pop-sm">Join Lobby</span>
            </div>
          </Link>
          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} />
        </div>
      </div>
    </div>
  );
}

export function FeedCardAnnouncement({
  postId,
  author,
  timeAgo,
  content,
  title,
  subtitle,
  likes,
  comments,
}: {
  postId: string;
  author: string;
  handle: string;
  timeAgo: string;
  content: string;
  title: string;
  subtitle: string;
  likes: number;
  comments: number;
}) {
  const hasHighlight = content.includes("500 SOL");
  const parts = content.split("500 SOL");
  return (
    <div className="bg-surface-light dark:bg-surface-dark border-l-4 border-l-primary border-y border-r border-y-slate-200 dark:border-y-slate-700 border-r-slate-200 dark:border-r-slate-700 rounded-xl p-5 shadow-sm pop-card">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
          {author[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><h4 className="font-display font-bold text-lg">{author}</h4><p className="text-xs text-slate-500">{timeAgo}</p></div>
            <button type="button" className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
          </div>
          <p className="mt-3 text-slate-700 dark:text-slate-300">
            {hasHighlight ? <>{parts[0]}<span className="font-bold text-accent-blue bg-accent-blue/10 px-1 rounded">500 SOL</span>{parts[1]}</> : content}
          </p>
          <Link href="/match" className="mt-4 block rounded-xl overflow-hidden border-2 border-slate-900 dark:border-slate-600 relative h-48 w-full group">
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-primary to-slate-900" />
              <span className="material-icons text-6xl text-primary opacity-50 group-hover:scale-110 transition-transform duration-500">emoji_events</span>
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white font-display font-bold text-xl">{title}</h3>
                <p className="text-slate-300 text-sm">{subtitle}</p>
              </div>
            </div>
          </Link>
          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} showRepost />
        </div>
      </div>
    </div>
  );
}

export function FeedCardPost({
  postId,
  author,
  timeAgo,
  content,
  likes,
  comments,
  onDelete,
}: {
  postId: string;
  author: string;
  handle: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border-l-4 border-l-accent-teal border-y border-r border-y-slate-200 dark:border-y-slate-700 border-r-slate-200 dark:border-r-slate-700 rounded-xl p-5 shadow-sm pop-card">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-lg border-2 border-slate-900 dark:border-slate-600 bg-primary flex items-center justify-center text-slate-900 font-bold shrink-0">
          {author[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><h4 className="font-display font-bold text-lg">{author}</h4><p className="text-xs text-slate-500">{timeAgo}</p></div>
            {onDelete ? (
              <PostMenu onDelete={onDelete} />
            ) : (
              <button type="button" className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"><span className="material-icons">more_horiz</span></button>
            )}
          </div>
          <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} showShare />
        </div>
      </div>
    </div>
  );
}

export function FeedCardBotChallenge({ bot }: { bot: BotChallenge }) {
  const diffLabel = bot.difficulty === "easy" ? "Casual" : bot.difficulty === "medium" ? "Ranked" : "Elite";
  const borderColor = bot.difficulty === "easy" ? "border-l-primary" : bot.difficulty === "medium" ? "border-l-secondary" : "border-l-accent-purple";

  return (
    <div className={`bg-surface-light dark:bg-surface-dark border-l-4 ${borderColor} border-y border-r border-y-slate-200 dark:border-y-slate-700 border-r-slate-200 dark:border-r-slate-700 rounded-xl p-5 shadow-sm pop-card`}>
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-lg border-2 border-slate-900 dark:border-slate-600 ${bot.bgColor} flex items-center justify-center shrink-0`}>
          <span className={`material-icons text-xl ${bot.accentColor}`}>{bot.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-display font-bold text-lg flex items-center gap-2">
                {bot.botName}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${bot.bgColor} ${bot.accentColor}`}>{diffLabel}</span>
              </h4>
              <p className="text-xs text-slate-500">Bot • {bot.wpm} WPM</p>
            </div>
            <span className={`material-icons text-2xl ${bot.accentColor}`}>smart_toy</span>
          </div>
          <p className="mt-3 text-slate-700 dark:text-slate-300 leading-relaxed">{bot.message}</p>
          <Link href={`/game?difficulty=${bot.difficulty}`} className="mt-4 block bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-4 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${bot.bgColor} p-2 rounded-lg`}>
                  <span className={`material-icons ${bot.accentColor}`}>swords</span>
                </div>
                <div>
                  <h6 className="font-bold text-sm">Challenge {bot.botName}</h6>
                  <p className="text-xs text-slate-300">{diffLabel} • {bot.wpm} WPM • Free Practice</p>
                </div>
              </div>
              <span className="bg-primary text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-pop-sm group-hover:shadow-pop group-hover:-translate-y-0.5 transition-all">Race Now</span>
            </div>
          </Link>
          <SocialActions postId={bot.id} initialLikes={0} initialComments={0} />
        </div>
      </div>
    </div>
  );
}
