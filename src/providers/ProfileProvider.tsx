"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/store/user-store";
import { getProfileByWallet } from "@/lib/tapestry";

export default function ProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publicKey, connected } = useWallet();
  const { setWallet, setProfile, setProfileLoading } = useUserStore();

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      setWallet(address);
      loadProfile(address);
    } else {
      setWallet(null);
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  async function loadProfile(walletAddress: string) {
    setProfileLoading(true);
    try {
      const existing = await getProfileByWallet(walletAddress);
      if (existing) {
        setProfile(existing);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setProfileLoading(false);
    }
  }

  return <>{children}</>;
}
