import { create } from "zustand";
import type { TapestryProfile } from "@/lib/tapestry";

interface UserStore {
  // Wallet
  walletAddress: string | null;
  isConnected: boolean;

  // Profile
  profile: TapestryProfile | null;
  isProfileLoading: boolean;
  hasProfile: boolean;

  // Stats (aggregated from match history)
  stats: {
    totalWins: number;
    totalLosses: number;
    totalMatches: number;
    winRate: number;
    bestWPM: number;
    avgWPM: number;
    totalEarnings: number;
    currentStreak: number;
    rank: string;
  };

  // Actions
  setWallet: (address: string | null) => void;
  setProfile: (profile: TapestryProfile | null) => void;
  setProfileLoading: (loading: boolean) => void;
  updateStats: (stats: Partial<UserStore["stats"]>) => void;
  disconnect: () => void;
}

function getRank(wins: number): string {
  if (wins >= 100) return "Legend";
  if (wins >= 50) return "Diamond";
  if (wins >= 25) return "Platinum";
  if (wins >= 10) return "Gold";
  if (wins >= 5) return "Silver";
  return "Bronze";
}

export const useUserStore = create<UserStore>((set) => ({
  walletAddress: null,
  isConnected: false,

  profile: null,
  isProfileLoading: false,
  hasProfile: false,

  stats: {
    totalWins: 0,
    totalLosses: 0,
    totalMatches: 0,
    winRate: 0,
    bestWPM: 0,
    avgWPM: 0,
    totalEarnings: 0,
    currentStreak: 0,
    rank: "Bronze",
  },

  setWallet: (address) =>
    set({
      walletAddress: address,
      isConnected: !!address,
    }),

  setProfile: (profile) =>
    set({
      profile,
      hasProfile: !!profile,
    }),

  setProfileLoading: (loading) => set({ isProfileLoading: loading }),

  updateStats: (newStats) =>
    set((state) => {
      const updated = { ...state.stats, ...newStats };
      updated.rank = getRank(updated.totalWins);
      if (updated.totalMatches > 0) {
        updated.winRate = Math.round((updated.totalWins / updated.totalMatches) * 100);
      }
      return { stats: updated };
    }),

  disconnect: () =>
    set({
      walletAddress: null,
      isConnected: false,
      profile: null,
      hasProfile: false,
      isProfileLoading: false,
    }),
}));
