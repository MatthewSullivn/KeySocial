"use client";

import React, { createContext, useContext, useMemo } from "react";

const DEVNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

interface NetworkContextValue {
  rpcUrl: string;
  solscanSuffix: string;
  networkLabel: string;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<NetworkContextValue>(
    () => ({
      rpcUrl: DEVNET_RPC,
      solscanSuffix: "?cluster=devnet",
      networkLabel: "Devnet",
    }),
    []
  );

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
