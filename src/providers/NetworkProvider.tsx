"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";

type SolanaNetwork = "devnet" | "mainnet-beta";

interface NetworkContextValue {
  network: SolanaNetwork;
  rpcUrl: string;
  solscanSuffix: string;
  networkLabel: string;
  setNetwork: (network: SolanaNetwork) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const STORAGE_KEY = "keysocial-network";

function getDefaultNetwork(): SolanaNetwork {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "devnet" || stored === "mainnet-beta") return stored;
  }
  const env = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (env === "mainnet-beta") return "mainnet-beta";
  return "devnet";
}

function getRpcUrl(network: SolanaNetwork): string {
  if (network === "mainnet-beta") {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");
  }
  return "https://api.devnet.solana.com";
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<SolanaNetwork>(getDefaultNetwork);

  const setNetwork = useCallback((n: SolanaNetwork) => {
    setNetworkState(n);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, n);
    }
  }, []);

  // Sync on mount (SSR safety)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "devnet" || stored === "mainnet-beta") {
      setNetworkState(stored);
    }
  }, []);

  const value = useMemo<NetworkContextValue>(() => ({
    network,
    rpcUrl: getRpcUrl(network),
    solscanSuffix: network === "mainnet-beta" ? "" : "?cluster=devnet",
    networkLabel: network === "mainnet-beta" ? "Mainnet" : "Devnet",
    setNetwork,
  }), [network, setNetwork]);

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within <NetworkProvider>");
  return ctx;
}
