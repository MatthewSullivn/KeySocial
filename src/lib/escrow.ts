import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const PLATFORM_FEE = 0.05; // 5%

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export function getEscrowPublicKey(): PublicKey {
  const key = process.env.NEXT_PUBLIC_ESCROW_PUBKEY;
  if (!key) throw new Error("NEXT_PUBLIC_ESCROW_PUBKEY is not configured");
  return new PublicKey(key);
}

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export async function createDepositTransaction(
  fromPubkey: PublicKey,
  amountSOL: number
): Promise<Transaction> {
  const connection = getConnection();
  const escrowPubkey = getEscrowPublicKey();
  const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: escrowPubkey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = fromPubkey;

  return transaction;
}
