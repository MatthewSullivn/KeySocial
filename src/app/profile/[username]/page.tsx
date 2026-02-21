"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  createChallengePost,
  type TapestryProfile,
  type TapestryContent,
} from "@/lib/tapestry";
import { generateRoomCode } from "@/lib/multiplayer";
import { shortenAddress } from "@/lib/utils";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { connected, publicKey } = useWallet();
  const { profile: myProfile } = useUserStore();
  const connectedWallet = publicKey?.toBase58() || "";
  const [challengeLoading, setChallengeLoading] = useState(false);

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
  const [showAllMatches, setShowAllMatches] = useState(false);
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

  async function handleChallenge() {
    if (!myProfile || !profile || challengeLoading) return;
    setChallengeLoading(true);
    try {
      const room = generateRoomCode();
      const pid = myProfile.id || myProfile.username;
      await createChallengePost(pid, myProfile.username, profile.username, room);
      toast.success(`Challenge sent to ${profile.username}!`);
      router.push(`/game?mode=create&room=${room}`);
    } catch (err) {
      console.error("Failed to create challenge:", err);
      toast.error("Failed to create challenge");
      setChallengeLoading(false);
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
      <div className="min-h-screen bg-background text-text flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-gray-500 flex items-center gap-2">
            <span className="material-icons animate-spin">progress_activity</span>
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-text flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-200">
              <span className="material-icons text-4xl text-purple-500">person_off</span>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mb-2">Profile Not Found</div>
            <p className="text-gray-500 mt-2">This racer hasn&apos;t created their profile yet.</p>
            <Link href="/create-profile" className="inline-flex mt-6 bg-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-600 transition-colors">
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
  const visibleMatches = showAllMatches ? matchHistory : matchHistory.slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
          <div className="flex">
            <div className="w-1.5 bg-purple-500 shrink-0" />
            <div className="flex-1 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-purple-500 overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                    {profile.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.image} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      profile.username?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
                      {profile.username}
                    </h1>
                    <span className="material-icons-outlined text-base text-purple-500">verified</span>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center gap-2 flex-wrap">
                    Professional Racer
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    ID: #{(profile.id || profile.username).slice(0, 6).toUpperCase()}
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>

                  {profile.bio && (
                    <p className="text-gray-600 leading-relaxed max-w-3xl mt-3">{profile.bio}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => { setShowFollowers(true); setShowFollowing(false); }}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base text-gray-500">groups</span>
                      <b className="text-gray-900">{followerCount}</b> <span className="text-gray-500">Followers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowFollowing(true); setShowFollowers(false); }}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base text-gray-500">group_add</span>
                      <b className="text-gray-900">{followingCount}</b> <span className="text-gray-500">Following</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 font-mono text-sm hover:bg-gray-100 transition-colors cursor-pointer group"
                      title="Click to copy full address"
                    >
                      <span className="material-icons-outlined text-base text-gray-500">account_balance_wallet</span>
                      <span className="text-gray-700">{profile.walletAddress ? shortenAddress(profile.walletAddress) : "—"}</span>
                      <span className="material-icons text-sm text-gray-400 group-hover:text-purple-500 transition-colors">content_copy</span>
                    </button>
                  </div>

                  <div className="mt-4 flex gap-3 items-center flex-wrap">
                    {isOwnProfile && (
                      <button
                        onClick={openEditModal}
                        className="px-5 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-icons text-lg">edit</span>
                        Edit Profile
                      </button>
                    )}
                    {!connected ? (
                      <span className="text-sm text-gray-500">Connect wallet to follow</span>
                    ) : !isOwnProfile ? (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className="px-5 py-2 rounded-lg font-bold text-sm bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                      >
                        {isFollowing ? "Unfollow" : "Follow"}
                      </button>
                    ) : null}
                    <button
                      onClick={handleChallenge}
                      disabled={challengeLoading || !myProfile}
                      className="px-5 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {challengeLoading ? (
                        <><span className="material-icons animate-spin text-sm">progress_activity</span> Sending…</>
                      ) : (
                        <>
                          <span className="material-icons text-lg">swords</span>
                          Challenge
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit profile modal */}
        {showEdit && profile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => !editSaving && setShowEdit(false)}>
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="font-display font-bold text-lg text-gray-900">Edit profile</h3>
                <button type="button" onClick={() => !editSaving && setShowEdit(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="material-icons">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="flex flex-col overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Username</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    placeholder="your_username"
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                    placeholder="Tell the community about yourself..."
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400 mt-1">{editBio.length}/160</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Profile image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleLoadNfts}
                      disabled={nftLoading}
                      className="px-4 py-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 text-sm font-semibold hover:bg-purple-100 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {nftLoading ? "…" : "Use NFT"}
                    </button>
                  </div>
                  {editImage && (
                    <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editImage} alt="Preview" className="w-full h-full object-cover" onError={() => setEditImage("")} />
                    </div>
                  )}
                </div>
                {showNftPicker && nftList.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Pick an NFT from your wallet</p>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {nftList.map((nft, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setEditImage(nft.image); setShowNftPicker(false); }}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 focus:border-purple-500 transition-colors"
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
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="flex-1 py-2.5 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md mx-4 max-h-[70vh] flex flex-col shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="font-display font-bold text-lg text-gray-900">
                  {showFollowers ? "Followers" : "Following"}
                  <span className="ml-2 text-sm font-normal text-gray-500">({showFollowers ? followerCount : followingCount})</span>
                </h3>
                <button type="button" onClick={() => { setShowFollowers(false); setShowFollowing(false); }} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => { setShowFollowers(false); setShowFollowing(false); }}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-900 truncate">{u.username}</div>
                          {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                        </div>
                        <span className="material-icons text-gray-400 text-lg">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard icon="emoji_events" label="Total Wins" value={String(stats.wins)} iconColor="text-yellow-500" iconBg="bg-yellow-50" />
          <MetricCard icon="pie_chart" label="Win Rate" value={`${winRate}%`} iconColor="text-purple-500" iconBg="bg-purple-50" />
          <MetricCard icon="speed" label="Peak Speed" value={`${stats.bestWPM} WPM`} iconColor="text-blue-500" iconBg="bg-blue-50" />
          <MetricCard icon="payments" label="Earnings" value={`${stats.totalEarnings >= 0 ? "+" : ""}${stats.totalEarnings.toFixed(2)} SOL`} iconColor="text-green-600" iconBg="bg-green-50" />
        </div>

        {/* Match Log */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-900">Match Log</h3>
            <Link className="text-sm font-bold text-purple-600 hover:underline" href="/leaderboard">
              View Leaderboard
            </Link>
          </div>

          {matchHistory.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No matches yet. Start a duel from{" "}
              <Link className="text-purple-600 underline" href="/game?mode=create">Game</Link>.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-6 py-3 font-semibold">Result</th>
                      <th className="text-left px-6 py-3 font-semibold">Opponent</th>
                      <th className="text-center px-6 py-3 font-semibold">Speed / Acc</th>
                      <th className="text-center px-6 py-3 font-semibold">Date</th>
                      <th className="text-right px-6 py-3 font-semibold">Stake</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visibleMatches.map((m) => {
                      const props = m.properties || {};
                      const isWinner = props.winnerId === meId;
                      const opp = isWinner ? props.loserUsername : props.winnerUsername;
                      const wpm = isWinner ? props.winnerWPM : props.loserWPM;
                      const acc = isWinner ? props.winnerAccuracy : props.loserAccuracy;
                      return (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`material-icons text-lg ${isWinner ? "text-green-600" : "text-red-500"}`}>
                                {isWinner ? "check_circle" : "cancel"}
                              </span>
                              <span className={`font-bold text-sm ${isWinner ? "text-green-600" : "text-red-500"}`}>
                                {isWinner ? "WIN" : "LOSS"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {opp ? (
                              opp === "KeyBot" || opp.startsWith("ai-") ? (
                                <span className="text-gray-500">{opp}</span>
                              ) : (
                                <Link href={`/profile/${opp}`} className="text-gray-900 font-medium hover:text-purple-600 transition-colors">@{opp}</Link>
                              )
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-gray-700">
                            {wpm || "—"} WPM / {acc || "—"}%
                          </td>
                          <td className="px-6 py-4 text-center text-gray-500">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-700">
                            {props.stakeAmount && parseFloat(props.stakeAmount) > 0 ? `${props.stakeAmount} SOL` : "Practice"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {matchHistory.length > 10 && !showAllMatches && (
                <div className="px-6 py-4 border-t border-gray-100 text-center">
                  <button
                    onClick={() => setShowAllMatches(true)}
                    className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Load More History ({matchHistory.length - 10} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, iconColor, iconBg }: { icon: string; label: string; value: string; iconColor: string; iconBg: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
    </div>
  );
}
