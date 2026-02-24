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
const RPC_FALLBACK = "https://rpc.ankr.com/solana_devnet";
const TAPESTRY_API_URL =
  process.env.NEXT_PUBLIC_TAPESTRY_API_URL || "https://api.usetapestry.dev/api/v1";
const TAPESTRY_API_KEY =
  process.env.TAPESTRY_API_KEY || process.env.NEXT_PUBLIC_TAPESTRY_API_KEY || "";

function getEscrowKeypair(): Keypair {
  const secret = process.env.ESCROW_SECRET_KEY;
  if (!secret) throw new Error("ESCROW_SECRET_KEY not configured");
  return Keypair.fromSecretKey(bs58.decode(secret));
}

// Idempotency: prevent double payouts when client retries (e.g. refresh/remount)
const recentPayouts = new Map<string, { txSignature: string; payoutSOL: number; ts: number }>();
const PAYOUT_DEDUP_WINDOW_MS = 300_000; // 5 min

function getPayoutDedupKey(winnerWallet: string, stakeAmount: number): string {
  return `${winnerWallet}:${stakeAmount}`;
}

async function verifyMatchResult(
  matchContentId: string,
  winnerWallet: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${TAPESTRY_API_URL}/contents/${matchContentId}?apiKey=${TAPESTRY_API_KEY}`
    );
    if (!res.ok) return false;
    const data = await res.json();

    // The content properties should include the match result data
    const content = data.content || data;
    const props = content.properties || content;
    const type = props.type || props.contentType;
    if (type !== "match_result") return false;

    // Verify winner — we check winnerId matches the wallet requesting payout
    // The winnerId in Tapestry is a profile ID, not wallet, so we verify
    // the requesting wallet is associated with the winner
    const winnerId = props.winnerId;
    if (!winnerId) return false;

    // For MVP, we trust the client-provided winnerWallet if the match exists
    // and has a valid winnerId. A production system would cross-reference
    // the winnerId to a wallet via Tapestry profile lookup.
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winnerWallet, stakeAmount, matchContentId, idempotencyKey } = body;

    if (!winnerWallet || !stakeAmount) {
      return NextResponse.json(
        { error: "Missing required fields: winnerWallet, stakeAmount" },
        { status: 400 }
      );
    }

    if (stakeAmount <= 0) {
      return NextResponse.json(
        { error: "Stake amount must be positive" },
        { status: 400 }
      );
    }

    // Verify match result on Tapestry when a concrete content id is provided.
    // During immediate post-race payout, clients may still pass "pending".
    if (matchContentId && matchContentId !== "pending") {
      const verified = await verifyMatchResult(matchContentId, winnerWallet);
      if (!verified) {
        return NextResponse.json(
          { error: "Could not verify match result" },
          { status: 403 }
        );
      }
    }

    // Idempotency: return cached result if we already processed this request
    const dedupKey = idempotencyKey ?? getPayoutDedupKey(winnerWallet, stakeAmount);
    const now = Date.now();
    for (const [k, v] of recentPayouts) {
      if (now - v.ts > PAYOUT_DEDUP_WINDOW_MS) recentPayouts.delete(k);
    }
    const cached = recentPayouts.get(dedupKey);
    if (cached && now - cached.ts < PAYOUT_DEDUP_WINDOW_MS) {
      return NextResponse.json({
        txSignature: cached.txSignature,
        payoutSOL: cached.payoutSOL,
        alreadyProcessed: true,
      });
    }

    const escrowKeypair = getEscrowKeypair();
    let connection = new Connection(RPC_URL, "confirmed");
    const winnerPubkey = new PublicKey(winnerWallet);

    // Winner gets both stakes (full pot)
    const totalPot = stakeAmount * 2;
    const payoutSOL = totalPot;
    const payoutLamports = Math.round(payoutSOL * LAMPORTS_PER_SOL);

    const balance = await connection.getBalance(escrowKeypair.publicKey);
    if (balance < payoutLamports) {
      return NextResponse.json(
        {
          error: "Escrow has insufficient balance",
          details: `Escrow has ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL, need ${payoutSOL} SOL. Deposits may not have confirmed yet.`,
        },
        { status: 402 }
      );
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: payoutLamports,
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;
    transaction.feePayer = escrowKeypair.publicKey;

    let txSignature: string;
    try {
      txSignature = await connection.sendTransaction(transaction, [escrowKeypair]);
      await waitForSignatureConfirmation(connection, txSignature, "confirmed");
    } catch (rpcErr) {
      const msg = String(rpcErr);
      if (
        (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED") || msg.includes("503") || msg.includes("429") || msg.includes("404")) &&
        RPC_URL !== RPC_FALLBACK
      ) {
        connection = new Connection(RPC_FALLBACK, "confirmed");
        const retryTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: escrowKeypair.publicKey,
            toPubkey: winnerPubkey,
            lamports: payoutLamports,
          })
        );
        const { blockhash: bh, lastValidBlockHeight: lvh } =
          await connection.getLatestBlockhash("confirmed");
        retryTx.recentBlockhash = bh;
        retryTx.lastValidBlockHeight = lvh;
        retryTx.feePayer = escrowKeypair.publicKey;
        txSignature = await connection.sendTransaction(retryTx, [escrowKeypair]);
        await waitForSignatureConfirmation(connection, txSignature, "confirmed");
      } else {
        throw rpcErr;
      }
    }

    recentPayouts.set(dedupKey, { txSignature, payoutSOL, ts: Date.now() });

    return NextResponse.json({ txSignature, payoutSOL });
  } catch (err) {
    console.error("Payout error:", err);
    return NextResponse.json(
      { error: "Payout failed", details: String(err) },
      { status: 500 }
    );
  }
}
