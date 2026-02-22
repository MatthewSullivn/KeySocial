"use client";

import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function WalletCTA() {
  return (
    <WalletMultiButton className="!bg-white !text-purple-600 !px-8 !py-3 !rounded-xl !text-base !font-bold !border-2 !border-purple-200 hover:!bg-purple-50 !transition-colors !h-auto" />
  );
}
