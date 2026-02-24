import { NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import bs58 from "bs58";
import { waitForSignatureConfirmation } from "@/lib/escrow";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// In-memory dedup: prevent double refunds within a 30s window
const recentRefunds = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;

function getEscrowKeypair(): Keypair {
  const secret = process.env.ESCROW_SECRET_KEY;
  if (!secret) throw new Error("ESCROW_SECRET_KEY not configured");
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amount, network } = body;

    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
        { status: 400 }
      );
    }

    // Dedup: reject duplicate refund requests within 30s window
    const dedupKey = `${walletAddress}-${amount}-${network || "devnet"}`;
    const now = Date.now();
    // Cleanup stale entries
    for (const [key, ts] of recentRefunds) {
      if (now - ts > DEDUP_WINDOW_MS) recentRefunds.delete(key);
    }
    const lastRefund = recentRefunds.get(dedupKey);
    if (lastRefund && now - lastRefund < DEDUP_WINDOW_MS) {
      console.log("[Refund] Dedup rejected:", dedupKey);
      return NextResponse.json(
        { error: "Duplicate refund request", dedupKey },
        { status: 409 }
      );
    }
    recentRefunds.set(dedupKey, now);

    // Always devnet
    const rpcUrl = RPC_URL;

    const escrowKeypair = getEscrowKeypair();
    const connection = new Connection(rpcUrl, "confirmed");
    const recipientPubkey = new PublicKey(walletAddress);

    const lamports = Math.round(amount * LAMPORTS_PER_SOL);

    // Verify escrow has enough balance
    const balance = await connection.getBalance(escrowKeypair.publicKey);
    if (balance < lamports + 5000) {
      return NextResponse.json(
        { error: "Escrow balance insufficient for refund" },
        { status: 500 }
      );
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    const txSignature = await connection.sendTransaction(transaction, [escrowKeypair]);
    await waitForSignatureConfirmation(connection, txSignature, "confirmed");

    return NextResponse.json({ txSignature, refundedAmount: amount });
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json(
      { error: "Refund failed", details: String(err) },
      { status: 500 }
    );
  }
}
