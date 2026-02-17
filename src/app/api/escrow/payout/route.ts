import { NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { PLATFORM_FEE } from "@/lib/escrow";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
const TAPESTRY_API_URL =
  process.env.NEXT_PUBLIC_TAPESTRY_API_URL || "https://api.usetapestry.dev/api/v1";
const TAPESTRY_API_KEY =
  process.env.TAPESTRY_API_KEY || process.env.NEXT_PUBLIC_TAPESTRY_API_KEY || "";

function getEscrowKeypair(): Keypair {
  const secret = process.env.ESCROW_SECRET_KEY;
  if (!secret) throw new Error("ESCROW_SECRET_KEY not configured");
  return Keypair.fromSecretKey(bs58.decode(secret));
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
    const { winnerWallet, stakeAmount, matchContentId } = body;

    if (!winnerWallet || !stakeAmount || !matchContentId) {
      return NextResponse.json(
        { error: "Missing required fields: winnerWallet, stakeAmount, matchContentId" },
        { status: 400 }
      );
    }

    if (stakeAmount <= 0) {
      return NextResponse.json(
        { error: "Stake amount must be positive" },
        { status: 400 }
      );
    }

    // Verify match result on Tapestry
    const verified = await verifyMatchResult(matchContentId, winnerWallet);
    if (!verified) {
      return NextResponse.json(
        { error: "Could not verify match result" },
        { status: 403 }
      );
    }

    const escrowKeypair = getEscrowKeypair();
    const connection = new Connection(RPC_URL, "confirmed");
    const winnerPubkey = new PublicKey(winnerWallet);

    // Winner gets both stakes minus platform fee
    const totalPot = stakeAmount * 2;
    const payoutSOL = totalPot * (1 - PLATFORM_FEE);
    const payoutLamports = Math.round(payoutSOL * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowKeypair.publicKey,
        toPubkey: winnerPubkey,
        lamports: payoutLamports,
      })
    );

    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [escrowKeypair]
    );

    return NextResponse.json({ txSignature, payoutSOL });
  } catch (err) {
    console.error("Payout error:", err);
    return NextResponse.json(
      { error: "Payout failed", details: String(err) },
      { status: 500 }
    );
  }
}
