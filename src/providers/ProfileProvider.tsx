"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserStore } from "@/store/user-store";
import { getProfileByWallet } from "@/lib/tapestry";

export default function ProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { publicKey, connected } = useWallet();
  const setWallet = useUserStore((s) => s.setWallet);
  const setProfile = useUserStore((s) => s.setProfile);
  const setProfileLoading = useUserStore((s) => s.setProfileLoading);
  const profile = useUserStore((s) => s.profile);
  const loadingRef = useRef(false);

  // When wallet connects/disconnects, sync state
  useEffect(() => {
    if (connected && publicKey) {
      setWallet(publicKey.toBase58());
    } else {
      setWallet(null);
      setProfile(null);
      setProfileLoading(false);
    }
  }, [connected, publicKey, setWallet, setProfile, setProfileLoading]);

  // Load profile when wallet connects, with retry
  useEffect(() => {
    if (!connected || !publicKey) return;
    if (profile) return; // already loaded
    if (loadingRef.current) return;

    let cancelled = false;
    const address = publicKey.toBase58();

    async function load(attempt: number) {
      if (cancelled) return;
      loadingRef.current = true;
      setProfileLoading(true);
      try {
        const existing = await getProfileByWallet(address);
        if (cancelled) return;
        if (existing) {
          setProfile(existing);
        }
      } catch (err) {
        console.error("Error loading profile (attempt " + attempt + "):", err);
        // Retry up to 3 times with increasing delay
        if (!cancelled && attempt < 3) {
          setTimeout(() => load(attempt + 1), 1000 * attempt);
          return; // don't set loading false yet
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          loadingRef.current = false;
        }
      }
    }

    load(1);

    return () => {
      cancelled = true;
      loadingRef.current = false;
    };
  }, [connected, publicKey, profile, setProfile, setProfileLoading]);

  return <>{children}</>;
}
