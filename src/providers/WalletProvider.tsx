"use client";

import React, { useMemo, useEffect, useRef } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useNetwork } from "@/providers/NetworkProvider";
import { toast } from "sonner";

import "@solana/wallet-adapter-react-ui/styles.css";

// Known genesis hashes
const GENESIS_MAINNET = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
const GENESIS_DEVNET = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

/**
 * After the wallet auto-reconnects on a network switch, verify that the
 * wallet's chain actually matches the app-selected network by comparing
 * the genesis hash the RPC returns.  If they diverge Phantom is still
 * pointed at the wrong cluster → warn the user.
 */
function NetworkMismatchGuard() {
  const { network } = useNetwork();
  const { connection } = useConnection();
  const { connected, wallet } = useWallet();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!connected) {
      checkedRef.current = null;
      return;
    }
    // Only check once per network+wallet combo
    const key = `${network}-${wallet?.adapter.name}`;
    if (checkedRef.current === key) return;
    checkedRef.current = key;

    let cancelled = false;

    connection
      .getGenesisHash()
      .then((hash) => {
        if (cancelled) return;
        const expected = network === "mainnet-beta" ? GENESIS_MAINNET : GENESIS_DEVNET;
        if (hash !== expected) {
          const expectedLabel = network === "mainnet-beta" ? "Mainnet" : "Devnet";
          toast.warning(
            `Your wallet is connected to a different network. Switch your wallet to ${expectedLabel} in its settings.`,
            { duration: 8000 }
          );
        }
      })
      .catch(() => {
        // RPC unreachable — not much we can do
      });

    return () => { cancelled = true; };
  }, [connected, connection, network, wallet]);

  return null;
}

export default function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { rpcUrl, network } = useNetwork();

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // Key on network so the entire wallet stack remounts when the user
  // switches networks — this disconnects the old session and auto-
  // reconnects against the new RPC endpoint.
  return (
    <ConnectionProvider endpoint={rpcUrl} key={network}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <NetworkMismatchGuard />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
