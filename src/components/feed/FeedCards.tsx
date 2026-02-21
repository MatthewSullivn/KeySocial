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
        className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
      >
        <span className="material-icons">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
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
    accentColor: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    id: "bot-medium",
    botName: "Medium Bot",
    difficulty: "medium",
    wpm: 60,
    message: "I type at a solid 60 WPM. Not too fast, not too slow. Ready to test your skills against a real challenge? Bring it on!",
    icon: "local_fire_department",
    accentColor: "text-pink-500",
    bgColor: "bg-pink-50",
  },
  {
    id: "bot-hard",
    botName: "Hard Bot",
    difficulty: "hard",
    wpm: 100,
    message: "100 WPM. No mercy. Only the fastest typists survive against me. Do you have what it takes, or will you crumble under pressure?",
    icon: "bolt",
    accentColor: "text-purple-600",
    bgColor: "bg-purple-50",
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

export function FeedCardFromContent({ content }: { content: TapestryContent; profile: TapestryProfile | null }) {
  const props = content.properties || {};
  const isMatch = props.type === "match_result";

  if (isMatch) {
    return (
      <FeedCardRaceResult
        postId={content.id}
        timeAgo={content.createdAt ? formatTimeAgo(content.createdAt) : "—"}
        likes={content.socialCounts?.likes ?? 0}
        comments={content.socialCounts?.comments ?? 0}
        winnerUsername={props.winnerUsername || "Unknown"}
        loserUsername={props.loserUsername || "Unknown"}
        winnerWPM={parseInt(props.winnerWPM || "0")}
        loserWPM={parseInt(props.loserWPM || "0")}
        winnerAccuracy={parseInt(props.winnerAccuracy || "0")}
        loserAccuracy={parseInt(props.loserAccuracy || "0")}
        stakeAmount={parseFloat(props.stakeAmount || "0")}
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
  postId, timeAgo, likes, comments, hasLiked,
  winnerUsername, loserUsername, winnerWPM, loserWPM, winnerAccuracy, loserAccuracy, stakeAmount,
}: {
  postId: string; timeAgo: string; likes: number; comments: number; hasLiked?: boolean;
  winnerUsername: string; loserUsername: string; winnerWPM: number; loserWPM: number;
  winnerAccuracy: number; loserAccuracy: number; stakeAmount: number;
}) {
  return (
    <div className="bg-white border-l-4 border-l-pink-500 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-icons text-pink-500 text-lg">emoji_events</span>
        <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">Race Result</span>
        <span className="text-xs text-gray-400 ml-auto">{timeAgo}</span>
      </div>

      <div className="bg-[#0f1115] border border-gray-700 rounded-xl p-5">
        {/* VS header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <Link href={`/profile/${winnerUsername}`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl font-black border-2 border-yellow-400 group-hover:ring-2 group-hover:ring-purple-400 transition-all">
              {winnerUsername[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors truncate max-w-[100px]">{winnerUsername}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 font-bold">WINNER</span>
          </Link>

          <div className="text-2xl font-black text-gray-500">VS</div>

          <Link href={`/profile/${loserUsername}`} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-black group-hover:ring-2 group-hover:ring-gray-400 transition-all">
              {loserUsername[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-sm text-white group-hover:text-purple-400 transition-colors truncate max-w-[100px]">{loserUsername}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-bold">DEFEATED</span>
          </Link>
        </div>

        {/* Stats comparison */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-800 rounded-lg p-3">
            <span className="text-xs uppercase font-bold text-gray-400 block mb-1">WPM</span>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-purple-400">{winnerWPM}</span>
              <span className="text-xs text-gray-600">vs</span>
              <span className="text-lg font-black text-gray-400">{loserWPM}</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Accuracy</span>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-purple-400">{winnerAccuracy}%</span>
              <span className="text-xs text-gray-600">vs</span>
              <span className="text-lg font-black text-gray-400">{loserAccuracy}%</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Stake</span>
            <span className="text-lg font-black text-white">{stakeAmount > 0 ? `${stakeAmount} SOL` : "Practice"}</span>
          </div>
        </div>
      </div>

      <SocialActions postId={postId} initialLikes={likes} initialComments={comments} initialHasLiked={hasLiked} showRepost showShare />
    </div>
  );
}

export function FeedCardPost({
  postId, author, timeAgo, content, likes, comments, hasLiked, onDelete, postType, meta,
}: {
  postId: string; author: string; handle: string; timeAgo: string; content: string;
  likes: number; comments: number; hasLiked?: boolean; onDelete?: () => void;
  postType?: "normal" | "flex" | "challenge" | "match_result"; meta?: { wpm?: number; challengerUsername?: string; roomCode?: string; challengedUsername?: string };
}) {
  const borderColor =
    postType === "flex"
      ? "border-l-pink-500"
      : postType === "challenge"
      ? "border-l-purple-500"
      : "border-l-gray-300";

  return (
    <div className={`bg-white border-l-4 ${borderColor} border border-gray-200 rounded-xl p-5`}>
      <div className="flex gap-4">
        <Link href={`/profile/${author}`} className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shrink-0 hover:ring-2 hover:ring-purple-300 transition-all">
          {author[0]?.toUpperCase()}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div><Link href={`/profile/${author}`} className="font-display font-bold text-lg text-gray-900 hover:text-purple-600 transition-colors">{author}</Link><p className="text-xs text-gray-500">{timeAgo}</p></div>
            {onDelete ? (
              <PostMenu onDelete={onDelete} />
            ) : (
              <button type="button" className="text-gray-400 hover:text-gray-600 p-1"><span className="material-icons">more_horiz</span></button>
            )}
          </div>
          <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>

          {postType === "flex" && meta?.wpm != null && (
            <WpmFlexBlock wpm={meta.wpm} author={author} />
          )}

          {postType === "challenge" && (
            <ChallengeBlock
              challengerUsername={meta?.challengerUsername || author}
              roomCode={meta?.roomCode}
              challengedUsername={meta?.challengedUsername}
            />
          )}

          <SocialActions postId={postId} initialLikes={likes} initialComments={comments} initialHasLiked={hasLiked} showShare />
        </div>
      </div>
    </div>
  );
}

function WpmFlexBlock({ wpm, author }: { wpm: number; author: string }) {
  const tier = wpm >= 100 ? "Elite" : wpm >= 70 ? "Advanced" : wpm >= 40 ? "Intermediate" : "Beginner";
  const tierColor = wpm >= 100 ? "text-purple-600" : wpm >= 70 ? "text-pink-500" : wpm >= 40 ? "text-pink-400" : "text-purple-500";
  const tierBg = wpm >= 100 ? "bg-purple-50" : wpm >= 70 ? "bg-pink-50" : wpm >= 40 ? "bg-pink-50" : "bg-purple-50";

  return (
    <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-5 relative">
        <div className="absolute top-3 right-3 opacity-10">
          <span className="material-icons text-6xl text-purple-500">speed</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons text-purple-500 text-lg">emoji_events</span>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">Personal Best</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tierBg} ${tierColor} ml-auto`}>{tier}</span>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <span className="text-5xl font-black text-gray-900 font-display">{wpm}</span>
            <span className="text-lg font-bold text-gray-500 ml-1">WPM</span>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                style={{ width: `${Math.min(100, (wpm / 150) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">0</span>
              <span className="text-[10px] text-gray-400">150</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            <span className="font-bold text-gray-700">@{author}</span> on KeySocial
          </span>
          <Link href="/game" className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
            Beat this <span className="material-icons text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChallengeBlock({ challengerUsername, roomCode, challengedUsername }: { challengerUsername: string; roomCode?: string; challengedUsername?: string }) {
  const challengeLabel = challengedUsername
    ? `wants to race @${challengedUsername}`
    : "wants to race you in a 1v1 typing duel";

  const acceptHref = roomCode
    ? `/game?mode=join&room=${roomCode}`
    : "/game?mode=create";

  const acceptLabel = roomCode
    ? "Accept Challenge (Join Room)"
    : "Accept Challenge (Create Room)";

  return (
    <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-5 relative">
        <div className="absolute top-3 right-3 opacity-10">
          <span className="material-icons text-6xl text-purple-500">swords</span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons text-purple-500 text-lg">swords</span>
          <span className="text-xs font-bold text-purple-500 uppercase tracking-widest">
            {challengedUsername ? "Direct Challenge" : "Open Challenge"}
          </span>
          {roomCode && (
            <span className="text-xs font-mono text-gray-500 ml-auto">Room: {roomCode}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-600 text-xl font-black shrink-0">
            {challengerUsername[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-display font-bold text-gray-900 text-lg">@{challengerUsername}</h5>
            <p className="text-sm text-gray-500">{challengeLabel}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-2 border border-gray-100">
            <span className="material-icons text-base text-teal-500">timer</span>
            <span className="block text-xs text-gray-500 mt-0.5">Real-time</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100">
            <span className="material-icons text-base text-pink-500">group</span>
            <span className="block text-xs text-gray-500 mt-0.5">1v1</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-gray-100">
            <span className="material-icons text-base text-purple-500">bolt</span>
            <span className="block text-xs text-gray-500 mt-0.5">Any Skill</span>
          </div>
        </div>
        <Link href={acceptHref} className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-purple-500/10 border border-purple-500 text-purple-600 font-bold rounded-xl hover:bg-purple-500/20 transition-all">
          <span className="material-icons text-lg">play_arrow</span>
          {acceptLabel}
        </Link>
      </div>
    </div>
  );
}

export function FeedCardBotChallenge({ bot }: { bot: BotChallenge }) {
  const diffLabel = bot.difficulty === "easy" ? "Casual" : bot.difficulty === "medium" ? "Ranked" : "Elite";

  return (
    <div className="bg-white border-l-4 border-l-gray-300 border border-gray-200 rounded-xl p-5">
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-full ${bot.bgColor} flex items-center justify-center shrink-0 border border-gray-200`}>
          <span className={`material-icons text-xl ${bot.accentColor}`}>{bot.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
                {bot.botName}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${bot.bgColor} ${bot.accentColor}`}>{diffLabel}</span>
              </h4>
              <p className="text-xs text-gray-500">Bot • {bot.wpm} WPM</p>
            </div>
            <span className={`material-icons text-2xl ${bot.accentColor}`}>smart_toy</span>
          </div>
          <p className="mt-3 text-gray-600 leading-relaxed">{bot.message}</p>
          <Link href={`/game?mode=bot&difficulty=${bot.difficulty}`} className="mt-4 block bg-gray-50 text-gray-900 rounded-xl p-4 hover:bg-gray-100 transition-colors group border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${bot.bgColor} p-2 rounded-lg`}>
                  <span className={`material-icons ${bot.accentColor}`}>swords</span>
                </div>
                <div>
                  <h6 className="font-bold text-sm">Challenge {bot.botName}</h6>
                  <p className="text-xs text-gray-500">{diffLabel} • {bot.wpm} WPM • Free Practice</p>
                </div>
              </div>
              <span className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Race Now</span>
            </div>
          </Link>
          <SocialActions postId={bot.id} initialLikes={0} initialComments={0} />
        </div>
      </div>
    </div>
  );
}
