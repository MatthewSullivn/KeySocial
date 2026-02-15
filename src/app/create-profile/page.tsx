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

    if (!connected || !walletAddress) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (username.length > 20) {
      setError("Username must be 20 characters or less.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setLoading(true);
    try {
      const profile = await findOrCreateProfile(
        walletAddress,
        username.toLowerCase(),
        bio
      );
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
    <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans min-h-screen flex flex-col transition-colors duration-300">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <svg
          className="absolute -top-20 -left-20 w-96 h-96 text-primary opacity-40 dark:opacity-20 animate-pulse"
          style={{ animationDuration: "8s" }}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.2C59,40.9,47.1,47.4,35.7,55.1C24.3,62.8,13.4,71.7,0.7,70.5C-12,69.3,-22.9,58,-35.1,50.8C-47.3,43.6,-60.8,40.5,-69.5,31.7C-78.2,22.9,-82.1,8.4,-78.7,-4.3C-75.3,-17,-64.6,-27.9,-53.6,-36.5C-42.6,-45.1,-31.3,-51.4,-19.6,-56.9C-7.9,-62.4,4.2,-67.1,17.1,-70.8C30,-74.5,44.7,-76.4,44.7,-76.4Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
        <svg
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] text-primary opacity-40 dark:opacity-20"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M38.1,-64.8C49.9,-59.1,60.5,-51.3,69.5,-41.8C78.5,-32.3,85.9,-21.1,85.6,-10.1C85.3,0.9,77.3,11.7,69.7,21.8C62.1,31.9,54.9,41.3,45.6,48.8C36.3,56.3,24.9,61.9,13.2,63.9C1.5,65.9,-10.5,64.3,-21.7,59.8C-32.9,55.3,-43.3,47.9,-52.3,38.8C-61.3,29.7,-68.9,18.9,-70.8,7.1C-72.7,-4.7,-68.9,-17.5,-61.7,-28.4C-54.5,-39.3,-43.9,-48.3,-32.6,-54.3C-21.3,-60.3,-9.3,-63.3,2.2,-67.1C13.7,-70.9,26.3,-70.5,38.1,-64.8Z"
            fill="currentColor"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      <AppHeader />

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center p-6 sm:p-12">
        {!connected ? (
          /* Connect wallet prompt */
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-primary/30">
              <span className="material-icons text-4xl text-primary">person_add</span>
            </div>
            <h1 className="text-3xl font-extrabold mb-3">Create Your Profile</h1>
            <p className="text-muted-light dark:text-muted-dark mb-8 leading-relaxed">
              Connect your Solana wallet to get started on KeySocial.
            </p>
            <WalletMultiButton className="!bg-black hover:!bg-gray-800 !text-white dark:!bg-white dark:!text-black dark:hover:!bg-gray-200 !px-6 !py-3 !rounded-full !text-sm !font-bold !shadow-lg" />
          </div>
        ) : (
          /* Profile creation form */
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
                <span className="material-icons text-4xl text-primary">person_add</span>
              </div>
              <h1 className="text-3xl font-extrabold mb-2">Create Your Profile</h1>
              <p className="text-muted-light dark:text-muted-dark">
                Choose your racer name and join the competition.
              </p>
            </div>

            <form
              onSubmit={handleCreateProfile}
              className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 space-y-6"
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Username <span className="text-accent-pink">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-outlined text-muted-light dark:text-muted-dark text-xl">
                    alternate_email
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_racer_name"
                    maxLength={20}
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 rounded-xl bg-background-light dark:bg-background-dark border text-text-light dark:text-text-dark placeholder:text-gray-400 dark:placeholder:text-gray-600",
                      "focus:outline-none focus:ring-2 transition-all",
                      error && !username
                        ? "border-red-400 focus:ring-red-300/30"
                        : "border-gray-200 dark:border-gray-700 focus:ring-primary/30 focus:border-primary"
                    )}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-1.5">
                  3–20 characters. Letters, numbers, and underscores only.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Bio <span className="text-muted-light dark:text-muted-dark font-normal">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  maxLength={160}
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-xl bg-background-light dark:bg-background-dark border border-gray-200 dark:border-gray-700 text-text-light dark:text-text-dark placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-muted-light dark:text-muted-dark mt-1.5">
                  {bio.length}/160 characters
                </p>
              </div>

              {/* Wallet badge */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
                <span className="material-icons text-primary">account_balance_wallet</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-light dark:text-muted-dark">Connected Wallet</div>
                  <div className="text-sm font-mono truncate">{walletAddress}</div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 text-sm">
                  <span className="material-icons text-xl flex-shrink-0">error_outline</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className={cn(
                  "w-full py-4 rounded-xl font-extrabold text-lg transition-all flex items-center justify-center gap-2",
                  loading || !username.trim()
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-primary hover:bg-[#B8D43B] text-black shadow-lg hover:shadow-[0_0_15px_rgba(212,232,98,0.5)] transform hover:-translate-y-0.5"
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

              <p className="text-xs text-center text-muted-light dark:text-muted-dark">
                Your profile will be created onchain using Tapestry Protocol on Solana.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
