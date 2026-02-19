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
  updateProfile,
  type TapestryProfile,
  type TapestryContent,
} from "@/lib/tapestry";
import { shortenAddress } from "@/lib/utils";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { connected, publicKey } = useWallet();
  const { profile: myProfile } = useUserStore();
  const connectedWallet = publicKey?.toBase58() || "";

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
  const [showEdit, setShowEdit] = useState(false);
  const [showNftPicker, setShowNftPicker] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [nftList, setNftList] = useState<{ image: string; name: string }[]>([]);
  const [nftLoading, setNftLoading] = useState(false);
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    bestWPM: 0,
    avgAccuracy: 0,
    totalEarnings: 0,
  });

  const isOwnProfile = myProfile?.username === username || myProfile?.id === username;

  useEffect(() => { loadProfile(); }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const followingState = await checkFollowStatus(myProfile.id || myProfile.username, p.id || p.username);
        setIsFollowing(followingState);
      }

      const contents = await getContents(50, 0);
      const allMatches = contents.filter((c) => {
        const props = c.properties || {};
        return props.type === "match_result" && (props.winnerId === (p.id || p.username) || props.loserId === (p.id || p.username));
      });

      const deduped: TapestryContent[] = [];
      const seen = new Set<string>();
      for (const m of allMatches) {
        const pr = m.properties || {};
        const ts = m.createdAt ? Math.floor(new Date(m.createdAt).getTime() / 5000) : "";
        const key = `${pr.winnerId}-${pr.loserId}-${pr.winnerWPM}-${pr.loserWPM}-${ts}`;
        if (!seen.has(key)) { seen.add(key); deduped.push(m); }
      }
      setMatchHistory(deduped);

      let wins = 0, losses = 0, bestWPM = 0, totalAcc = 0, totalEarnings = 0;
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
      setStats({ wins, losses, bestWPM, avgAccuracy: deduped.length > 0 ? Math.round(totalAcc / deduped.length) : 0, totalEarnings });
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

  function openEditModal() {
    if (!profile) return;
    setEditUsername(profile.username || "");
    setEditBio(profile.bio || "");
    setEditImage(profile.image || "");
    setShowNftPicker(false);
    setNftList([]);
    setShowEdit(true);
  }

  async function handleLoadNfts() {
    const wallet = connectedWallet || profile?.walletAddress || myProfile?.walletAddress;
    if (!wallet) {
      toast.error("Connect your wallet first to load NFTs");
      return;
    }
    setNftLoading(true);
    setNftList([]);
    try {
      const res = await fetch(`/api/nfts?wallet=${encodeURIComponent(wallet)}`);
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.nfts?.length) {
        setNftList(data.nfts);
        setShowNftPicker(true);
      } else {
        toast.info(data.message || "No NFTs found. Add HELIUS_API_KEY to .env and restart the dev server.");
      }
    } catch {
      toast.error("Failed to load NFTs");
    } finally {
      setNftLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !myProfile || !isOwnProfile) return;
    const pid = profile.id || profile.username;
    if (!editUsername.trim()) {
      toast.error("Username is required");
      return;
    }
    setEditSaving(true);
    try {
      const updated = await updateProfile(pid, {
        username: editUsername.trim(),
        bio: editBio.trim() || undefined,
        image: editImage.trim() || undefined,
      });
      setProfile(updated);
      useUserStore.getState().setProfile(updated);
      toast.success("Profile updated!");
      setShowEdit(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-white flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-gray-400 flex items-center gap-2">
            <span className="material-icons animate-spin">progress_activity</span>
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary text-white flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/25">
              <span className="material-icons text-4xl text-purple-400">person_off</span>
            </div>
            <div className="text-2xl font-extrabold mb-2">Profile Not Found</div>
            <p className="text-gray-400 mt-2">This racer hasn&apos;t created their profile yet.</p>
            <Link href="/create-profile" className="inline-flex mt-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-glow-sm">
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
    <div className="min-h-screen bg-bg-primary text-white">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-16">
          <div className="flex-shrink-0 relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-glow-md overflow-hidden relative z-10 flex items-center justify-center text-white text-5xl font-black">
              {profile.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.username?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div className="absolute bottom-2 right-2 z-20 w-6 h-6 bg-accent-green border-4 border-bg-primary rounded-full"></div>
          </div>

          <div className="flex-grow pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="font-display font-bold text-4xl md:text-5xl mb-1">
                  {profile.username}
                </h1>
                <p className="text-gray-400 font-mono text-sm flex items-center gap-2">
                  <span className="material-icons-outlined text-base text-purple-400">verified</span>
                  Professional Racer
                  <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                  Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </p>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                {isOwnProfile && (
                  <button
                    onClick={openEditModal}
                    className="px-5 py-2 rounded-xl font-bold text-sm bg-bg-elevated border border-purple-500/20 text-gray-300 hover:bg-bg-hover transition-all flex items-center gap-1.5"
                  >
                    <span className="material-icons text-lg">edit</span>
                    Edit profile
                  </button>
                )}
                {!connected ? (
                  <span className="text-sm text-gray-500">Connect wallet to follow</span>
                ) : !isOwnProfile ? (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className="px-5 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:opacity-90 transition-all"
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                ) : null}
                <Link
                  href="/game?mode=create"
                  className="px-5 py-2 rounded-xl font-bold text-sm bg-bg-elevated border border-purple-500/20 text-gray-300 hover:bg-bg-hover transition-all"
                >
                  Challenge
                </Link>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-400 leading-relaxed max-w-3xl mt-4">{profile.bio}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <button
                type="button"
                onClick={() => { setShowFollowers(true); setShowFollowing(false); }}
                className="inline-flex items-center gap-2 bg-bg-card border border-purple-500/10 rounded-xl px-4 py-2 hover:border-purple-500/30 transition-colors cursor-pointer"
              >
                <span className="material-icons-outlined text-base text-gray-400">groups</span>
                <b>{followerCount}</b> Followers
              </button>
              <button
                type="button"
                onClick={() => { setShowFollowing(true); setShowFollowers(false); }}
                className="inline-flex items-center gap-2 bg-bg-card border border-purple-500/10 rounded-xl px-4 py-2 hover:border-purple-500/30 transition-colors cursor-pointer"
              >
                <span className="material-icons-outlined text-base text-gray-400">group_add</span>
                <b>{followingCount}</b> Following
              </button>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="inline-flex items-center gap-2 bg-bg-card border border-purple-500/10 rounded-xl px-4 py-2 font-mono hover:border-purple-500/30 transition-colors cursor-pointer group"
                title="Click to copy full address"
              >
                <span className="material-icons-outlined text-base text-gray-400">account_balance_wallet</span>
                {profile.walletAddress ? shortenAddress(profile.walletAddress) : "—"}
                <span className="material-icons text-sm text-gray-500 group-hover:text-purple-400 transition-colors">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit profile modal */}
        {showEdit && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !editSaving && setShowEdit(false)}>
            <div className="bg-bg-card rounded-2xl border border-purple-500/15 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
                <h3 className="font-display font-bold text-lg">Edit profile</h3>
                <button type="button" onClick={() => !editSaving && setShowEdit(false)} className="text-gray-500 hover:text-white transition-colors">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="flex flex-col overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-purple-500/15 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/30 outline-none"
                    placeholder="your_username"
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-purple-500/15 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/30 outline-none resize-none"
                    placeholder="Tell the community about yourself..."
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{editBio.length}/160</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Profile image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-bg-elevated border border-purple-500/15 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/30 outline-none"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleLoadNfts}
                      disabled={nftLoading}
                      className="px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-300 text-sm font-semibold hover:bg-purple-500/25 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {nftLoading ? "…" : "Use NFT"}
                    </button>
                  </div>
                  {editImage && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden bg-bg-elevated border border-purple-500/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImage} alt="Preview" className="w-full h-full object-cover" onError={() => setEditImage("")} />
                    </div>
                  )}
                </div>
                {showNftPicker && nftList.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-2">Pick an NFT from your wallet</p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {nftList.map((nft, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setEditImage(nft.image); setShowNftPicker(false); }}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500/50 focus:border-purple-500 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => !editSaving && setShowEdit(false)}
                    className="flex-1 py-2.5 rounded-xl border border-purple-500/20 text-gray-300 font-semibold hover:bg-bg-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {editSaving ? (<><span className="material-icons animate-spin text-lg">progress_activity</span> Saving…</>) : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Followers / Following modal */}
        {(showFollowers || showFollowing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
            <div className="bg-bg-card rounded-2xl border border-purple-500/15 w-full max-w-md mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/10">
                <h3 className="font-display font-bold text-lg">
                  {showFollowers ? "Followers" : "Following"}
                  <span className="ml-2 text-sm font-normal text-gray-500">({showFollowers ? followerCount : followingCount})</span>
                </h3>
                <button type="button" onClick={() => { setShowFollowers(false); setShowFollowing(false); }} className="text-gray-500 hover:text-white transition-colors">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {(showFollowers ? followersList : followingList).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {showFollowers ? "No followers yet" : "Not following anyone yet"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(showFollowers ? followersList : followingList).map((u) => (
                      <Link
                        key={u.id || u.username}
                        href={`/profile/${u.username}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-elevated transition-colors"
                        onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{u.username}</div>
                          {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                        </div>
                        <span className="material-icons text-gray-500 text-lg">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatPill title="Wins" value={String(stats.wins)} />
          <StatPill title="Losses" value={String(stats.losses)} />
          <StatPill title="Win Rate" value={`${winRate}%`} />
          <StatPill title="Best WPM" value={String(stats.bestWPM)} highlight />
        </div>

        {/* Match History */}
        <div className="bg-bg-card rounded-2xl border border-purple-500/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-500/10 flex items-center justify-between">
            <h3 className="font-display font-bold">Match History</h3>
            <Link className="text-sm font-bold text-purple-400 hover:underline" href="/leaderboard">
              View Leaderboard
            </Link>
          </div>
          {matchHistory.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No matches yet. Start a duel from{" "}
              <Link className="text-purple-400 underline" href="/game?mode=create">Game</Link>.
            </div>
          ) : (
            <div className="divide-y divide-purple-500/5">
              {matchHistory.slice(0, 20).map((m) => {
                const props = m.properties || {};
                const isWinner = props.winnerId === meId;
                const opp = isWinner ? props.loserUsername : props.winnerUsername;
                const wpm = isWinner ? props.winnerWPM : props.loserWPM;
                const acc = isWinner ? props.winnerAccuracy : props.loserAccuracy;
                return (
                  <div key={m.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isWinner ? "bg-purple-500/15 text-purple-400" : "bg-red-500/15 text-red-400"}`}>
                        <span className="material-icons-outlined">{isWinner ? "emoji_events" : "close"}</span>
                      </div>
                      <div>
                        <div className="font-bold">
                          {isWinner ? "WIN" : "LOSS"} <span className="text-gray-500 font-normal">vs</span>{" "}
                          {opp ? (
                            opp === "KeyBot" || opp.startsWith("ai-") ? (
                              <span className="text-gray-400">{opp}</span>
                            ) : (
                              <Link href={`/profile/${opp}`} className="hover:text-purple-400 transition-colors">{opp}</Link>
                            )
                          ) : "—"}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          {wpm || "—"} WPM &bull; {acc || "—"}% &bull; {props.stakeAmount || "0"} SOL
                        </div>
                        {m.createdAt && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
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
    <div className={highlight ? "bg-purple-500/10 border border-purple-500/25 rounded-2xl p-5 shadow-glow-sm" : "bg-bg-card border border-purple-500/10 rounded-2xl p-5"}>
      <div className="text-xs uppercase tracking-widest text-gray-500 font-bold">{title}</div>
      <div className="mt-2 text-3xl font-display font-bold">{value}</div>
    </div>
  );
}
