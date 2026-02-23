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

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

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

    // Use the network the client was on, fall back to env/devnet
    const rpcUrl =
      network === "mainnet-beta"
        ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || RPC_URL
        : network === "devnet"
        ? "https://api.devnet.solana.com"
        : RPC_URL;

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

    const txSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [escrowKeypair]
    );

    return NextResponse.json({ txSignature, refundedAmount: amount });
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json(
      { error: "Refund failed", details: String(err) },
      { status: 500 }
    );
  }
}
