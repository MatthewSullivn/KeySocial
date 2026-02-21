"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useUserStore } from "@/store/user-store";
import { findOrCreateProfile } from "@/lib/tapestry";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AppHeader from "@/components/layout/AppHeader";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function CreateProfilePage() {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { setProfile } = useUserStore();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const walletAddress = publicKey?.toBase58() || "";

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!connected || !walletAddress) { setError("Please connect your wallet first."); return; }
    if (!username.trim()) { setError("Username is required."); return; }
    if (username.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (username.length > 20) { setError("Username must be 20 characters or less."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username can only contain letters, numbers, and underscores."); return; }

    setLoading(true);
    try {
      const profile = await findOrCreateProfile(walletAddress, username.toLowerCase(), bio);
      setProfile(profile);
      toast.success("Profile created! Welcome to KeySocial.");
      router.push("/game");
    } catch (err: any) {
      console.error("Failed to create profile:", err);
      setError(err.message || "Failed to create profile. The username might be taken.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <AppHeader />

      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-12">
        {!connected ? (
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-200">
              <span className="material-icons text-4xl text-purple-500">person_add</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Create Your Profile</h1>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Connect your Solana wallet to get started on KeySocial.
            </p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-200">
                <span className="material-icons text-4xl text-purple-500">person_add</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your Profile</h1>
              <p className="text-gray-500">
                Choose your racer name and join the competition.
              </p>
            </div>

            <form
              onSubmit={handleCreateProfile}
              className="bg-white rounded-xl border border-gray-200 p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-gray-400 text-xl">
                    alternate_email
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_racer_name"
                    maxLength={20}
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 rounded-lg bg-gray-50 border text-gray-900 placeholder:text-gray-400",
                      "focus:outline-none focus:ring-2 transition-all",
                      error && !username
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-purple-200 focus:border-purple-500"
                    )}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  3-20 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {bio.length}/160 characters
                </p>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200">
                <span className="material-icons text-purple-500">account_balance_wallet</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-500">Connected Wallet</div>
                  <div className="text-sm font-mono text-gray-900 truncate">{walletAddress}</div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  <span className="material-icons text-xl flex-shrink-0">error_outline</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className={cn(
                  "w-full py-4 rounded-lg font-extrabold text-lg transition-all flex items-center justify-center gap-2",
                  loading || !username.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-500 text-white hover:bg-purple-600 hover:-translate-y-0.5"
                )}
              >
                {loading ? (
                  <>
                    <span className="material-icons animate-spin text-xl">progress_activity</span>
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-xl">check_circle</span>
                    Create Profile &amp; Start Racing
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                Your profile will be created onchain using Tapestry Protocol on Solana.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
