import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

export function getEscrowPublicKey(): PublicKey {
  const key = process.env.NEXT_PUBLIC_ESCROW_PUBKEY;
  if (!key) throw new Error("NEXT_PUBLIC_ESCROW_PUBKEY is not configured");
  return new PublicKey(key);
}

export function getConnection(rpcUrl?: string): Connection {
  return new Connection(rpcUrl || RPC_URL, "confirmed");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForSignatureConfirmation(
  connection: Connection,
  signature: string,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed",
  timeoutMs = 45_000
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const statusRes = await connection.getSignatureStatuses([signature]);
    const status = statusRes.value[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    const level = status?.confirmationStatus;
    const done =
      (commitment === "processed" && !!status) ||
      (commitment === "confirmed" && (level === "confirmed" || level === "finalized")) ||
      (commitment === "finalized" && level === "finalized");

    if (done) return;
    await sleep(700);
  }

  throw new Error("Transaction confirmation timed out");
}

export async function createDepositTransaction(
  fromPubkey: PublicKey,
  amountSOL: number,
  rpcUrl?: string
): Promise<Transaction> {
  const connection = getConnection(rpcUrl);
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
