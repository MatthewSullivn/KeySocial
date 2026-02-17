"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/store/user-store";
import {
  getProfile,
  getFollowers,
  getFollowing,
  followProfile,
  unfollowProfile,
  checkFollowStatus,
  getContents,
  type TapestryProfile,
  type TapestryContent,
} from "@/lib/tapestry";
import { shortenAddress } from "@/lib/utils";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { connected } = useWallet();
  const { profile: myProfile } = useUserStore();

  const [profile, setProfile] = useState<TapestryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [matchHistory, setMatchHistory] = useState<TapestryContent[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersList, setFollowersList] = useState<TapestryProfile[]>([]);
  const [followingList, setFollowingList] = useState<TapestryProfile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    bestWPM: 0,
    avgAccuracy: 0,
    totalEarnings: 0,
  });

  const isOwnProfile = myProfile?.username === username || myProfile?.id === username;

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      const p = await getProfile(username);
      setProfile(p);

      if (!p) return;

      const [followers, following] = await Promise.all([
        getFollowers(p.id || p.username, 50, 0),
        getFollowing(p.id || p.username, 50, 0),
      ]);
      setFollowerCount(p.socialCounts?.followers || followers.length);
      setFollowingCount(p.socialCounts?.following || following.length);
      setFollowersList(followers);
      setFollowingList(following);

      if (myProfile && !isOwnProfile) {
        const followingState = await checkFollowStatus(
          myProfile.id || myProfile.username,
          p.id || p.username
        );
        setIsFollowing(followingState);
      }

      const contents = await getContents(50, 0);
      const allMatches = contents.filter((c) => {
        const props = c.properties || {};
        return (
          props.type === "match_result" &&
          (props.winnerId === (p.id || p.username) || props.loserId === (p.id || p.username))
        );
      });
      // Deduplicate matches with same winner+loser+WPM within 5 seconds of each other
      const deduped: TapestryContent[] = [];
      const seen = new Set<string>();
      for (const m of allMatches) {
        const pr = m.properties || {};
        const ts = m.createdAt ? Math.floor(new Date(m.createdAt).getTime() / 5000) : "";
        const key = `${pr.winnerId}-${pr.loserId}-${pr.winnerWPM}-${pr.loserWPM}-${ts}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(m);
        }
      }
      setMatchHistory(deduped);

      let wins = 0,
        losses = 0,
        bestWPM = 0,
        totalAcc = 0,
        totalEarnings = 0;
      for (const m of deduped) {
        const props = m.properties || {};
        const isWinner = props.winnerId === (p.id || p.username);
        if (isWinner) {
          wins++;
          bestWPM = Math.max(bestWPM, parseInt(props.winnerWPM || "0"));
          totalAcc += parseInt(props.winnerAccuracy || "0");
          totalEarnings += parseFloat(props.stakeAmount || "0");
        } else {
          losses++;
          bestWPM = Math.max(bestWPM, parseInt(props.loserWPM || "0"));
          totalAcc += parseInt(props.loserAccuracy || "0");
          totalEarnings -= parseFloat(props.stakeAmount || "0");
        }
      }
      setStats({
        wins,
        losses,
        bestWPM,
        avgAccuracy: deduped.length > 0 ? Math.round(totalAcc / deduped.length) : 0,
        totalEarnings,
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    if (!myProfile || !profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowProfile(myProfile.id || myProfile.username, profile.id || profile.username);
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
        toast.success(`Unfollowed ${profile.username}`);
      } else {
        await followProfile(myProfile.id || myProfile.username, profile.id || profile.username);
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        toast.success(`Following ${profile.username}!`);
      }
    } catch {
      toast.error("Action failed. Try again.");
    } finally {
      setFollowLoading(false);
    }
  }

  function handleCopyWallet() {
    if (!profile?.walletAddress) return;
    navigator.clipboard.writeText(profile.walletAddress).then(() => {
      toast.success("Wallet address copied!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-muted-light dark:text-muted-dark flex items-center gap-2">
            <span className="material-icons animate-spin">progress_activity</span>
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex flex-col">
        <AppHeader />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
              <span className="material-icons text-4xl text-primary">person_off</span>
            </div>
            <div className="text-2xl font-extrabold mb-2">Profile Not Found</div>
            <p className="text-muted-light dark:text-muted-dark mt-2">This racer hasn&apos;t created their profile yet.</p>
            <Link href="/create-profile" className="inline-flex mt-6 bg-primary text-black px-6 py-3 rounded-full font-bold hover:bg-[#B8D43B] transition-colors shadow-lg">
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalMatches = stats.wins + stats.losses;
  const winRate = totalMatches > 0 ? Math.round((stats.wins / totalMatches) * 1000) / 10 : 0;
  const meId = profile.id || profile.username;

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans transition-colors duration-300 min-h-screen relative overflow-x-hidden">
      <div className="blob-shape top-[-10%] left-[-5%] w-96 h-96 bg-primary opacity-30 blur-3xl rounded-full"></div>
      <div className="blob-shape bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-primary opacity-20 blur-3xl rounded-full"></div>
      <div className="blob-shape top-[20%] right-[10%] w-48 h-48 bg-accent-teal opacity-20 blur-3xl rounded-full"></div>

      <AppHeader />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* header */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-16">
          <div className="flex-shrink-0 relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-card-dark shadow-xl overflow-hidden relative z-10 bg-primary flex items-center justify-center text-black text-5xl font-black">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="absolute bottom-2 right-2 z-20 w-6 h-6 bg-green-500 border-4 border-white dark:border-card-dark rounded-full"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"></div>
          </div>

          <div className="flex-grow pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display font-bold text-4xl md:text-5xl mb-1">
                  {profile.username}
                </h1>
                <p className="text-muted-light dark:text-muted-dark font-mono text-sm flex items-center gap-2">
                  <span className="material-icons-outlined text-base">verified</span>
                  Professional Racer
                  <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                  Joined {profile.createdAt ? `${new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${new Date(profile.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : "—"}
                </p>
              </div>

              <div className="flex gap-3 items-center">
                {!connected ? (
                  <span className="text-sm text-muted-light dark:text-muted-dark">
                    Connect wallet to follow
                  </span>
                ) : !isOwnProfile ? (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="px-5 py-2 rounded-full font-bold text-sm bg-primary text-black hover:bg-primary-hover transition-colors"
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                ) : null}
                <Link
                  href="/game?mode=create"
                  className="px-5 py-2 rounded-full font-bold text-sm bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition"
                >
                  Challenge
                </Link>
              </div>
            </div>

            {profile.bio && (
              <p className="text-muted-light dark:text-muted-dark leading-relaxed max-w-3xl mt-4">
                {profile.bio}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <button
                type="button"
                onClick={() => { setShowFollowers(true); setShowFollowing(false); }}
                className="inline-flex items-center gap-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm hover:border-primary transition-colors cursor-pointer"
              >
                <span className="material-icons-outlined text-base">groups</span>
                <b>{followerCount}</b> Followers
              </button>
              <button
                type="button"
                onClick={() => { setShowFollowing(true); setShowFollowers(false); }}
                className="inline-flex items-center gap-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm hover:border-primary transition-colors cursor-pointer"
              >
                <span className="material-icons-outlined text-base">group_add</span>
                <b>{followingCount}</b> Following
              </button>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="inline-flex items-center gap-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm font-mono hover:border-primary transition-colors cursor-pointer group"
                title="Click to copy full address"
              >
                <span className="material-icons-outlined text-base">account_balance_wallet</span>
                {profile.walletAddress ? shortenAddress(profile.walletAddress) : "—"}
                <span className="material-icons text-sm text-slate-400 group-hover:text-primary transition-colors">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Followers / Following modal */}
        {(showFollowers || showFollowing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="font-display font-bold text-lg">
                  {showFollowers ? "Followers" : "Following"}
                  <span className="ml-2 text-sm font-normal text-muted-light dark:text-muted-dark">
                    ({showFollowers ? followerCount : followingCount})
                  </span>
                </h3>
                <button type="button" onClick={() => { setShowFollowers(false); setShowFollowing(false); }} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {(showFollowers ? followersList : followingList).length === 0 ? (
                  <p className="text-center text-muted-light dark:text-muted-dark py-8">
                    {showFollowers ? "No followers yet" : "Not following anyone yet"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(showFollowers ? followersList : followingList).map((u) => (
                      <Link
                        key={u.id || u.username}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-black font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{u.username}</div>
                          {u.bio && <p className="text-xs text-slate-500 truncate">{u.bio}</p>}
                        </div>
                        <span className="material-icons text-slate-400 text-lg">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatPill title="Wins" value={String(stats.wins)} />
          <StatPill title="Losses" value={String(stats.losses)} />
          <StatPill title="Win Rate" value={`${winRate}%`} />
          <StatPill title="Earned" value={`${stats.totalEarnings.toFixed(2)} SOL`} highlight />
        </div>

        {/* history */}
        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-display font-bold">Match History</h3>
            <Link className="text-sm font-bold hover:underline" href="/leaderboard">
              View Leaderboard
            </Link>
          </div>
          {matchHistory.length === 0 ? (
            <div className="p-10 text-center text-muted-light dark:text-muted-dark">
              No matches yet. Start a duel from{" "}
              <Link className="underline" href="/game?mode=create">
                Game
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {matchHistory.slice(0, 20).map((m) => {
                const props = m.properties || {};
                const isWinner = props.winnerId === meId;
                const opp = isWinner ? props.loserUsername : props.winnerUsername;
                const wpm = isWinner ? props.winnerWPM : props.loserWPM;
                const acc = isWinner ? props.winnerAccuracy : props.loserAccuracy;
                return (
                  <div key={m.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isWinner ? "bg-primary text-black" : "bg-black text-white dark:bg-white dark:text-black"}`}>
                        <span className="material-icons-outlined">{isWinner ? "emoji_events" : "close"}</span>
                      </div>
                      <div>
                        <div className="font-bold">
                          {isWinner ? "WIN" : "LOSS"} <span className="text-muted-light dark:text-muted-dark font-normal">vs</span>{" "}
                          {opp ? (
                            opp === "KeyBot" || opp.startsWith("ai-") ? (
                              <span className="text-muted-light dark:text-muted-dark">{opp}</span>
                            ) : (
                              <Link href={`/profile/${opp}`} className="hover:text-primary transition-colors">{opp}</Link>
                            )
                          ) : "—"}
                        </div>
                        <div className="text-sm text-muted-light dark:text-muted-dark font-mono">
                          {wpm || "—"} WPM • {acc || "—"}% • {props.stakeAmount || "0"} SOL
                        </div>
                        {m.createdAt && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatPill({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "bg-primary/20 border border-primary rounded-2xl p-5 shadow-[0_0_20px_-5px_rgba(212,236,88,0.4)]" : "bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm"}>
      <div className="text-xs uppercase tracking-widest text-muted-light dark:text-muted-dark font-bold">{title}</div>
      <div className="mt-2 text-3xl font-display font-bold">{value}</div>
    </div>
  );
}
