import { NextRequest } from "next/server";

/** Fetch NFTs by wallet using Helius DAS API. Set HELIUS_API_KEY in .env to enable. */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
    return new Response(JSON.stringify({ error: "Invalid wallet" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.HELIUS_API_KEY || "";
  if (!apiKey) {
    return new Response(
      JSON.stringify({ nfts: [], message: "HELIUS_API_KEY not set. Add it to .env to load NFTs." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Use mainnet for NFT fetch — most NFTs live on mainnet even if the app uses devnet
  const forceMainnet = req.nextUrl.searchParams.get("network") !== "devnet";
  const base = forceMainnet ? "mainnet" : "devnet";

  try {
    const rpcUrl = `https://${base}.helius-rpc.com/?api-key=${apiKey}`;
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "nfts",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: wallet,
          page: 1,
          limit: 30,
          displayOptions: { showFungible: false, showNativeBalance: false },
        },
      }),
    });
    const data = (await res.json()) as {
      result?: { items?: unknown[]; total?: number };
      error?: { message?: string; code?: number };
    };

    if (data.error) {
      const msg = data.error.message || "Helius API error";
      console.error("[nfts] Helius error:", data.error);
      return new Response(
        JSON.stringify({ nfts: [], error: msg, message: msg }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const items = data?.result?.items ?? [];
    const nfts: { image: string; name: string }[] = [];

    for (const item of items as Record<string, unknown>[]) {
      const content = item?.content as Record<string, unknown> | undefined;
      if (!content) continue;
      let image = "";
      const metadata = content.metadata as Record<string, string> | undefined;
      const json = content.json as Record<string, string> | undefined;
      const links = content.links as Record<string, string> | undefined;
      if (links?.image) image = links.image;
      if (json?.image) image = image || json.image;
      if (json?.image_url) image = image || json.image_url;
      if (!image && metadata?.uri) {
        try {
          let metaUri = metadata.uri;
          if (metaUri.startsWith("ipfs://")) {
            metaUri = `https://ipfs.io/ipfs/${metaUri.slice(7)}`;
          }
          const metaRes = await fetch(metaUri, { signal: AbortSignal.timeout(4000) });
          if (metaRes.ok) {
            const meta = (await metaRes.json()) as Record<string, string>;
            image = image || meta?.image || meta?.image_url || "";
            if (image.startsWith("ipfs://")) {
              image = `https://ipfs.io/ipfs/${image.slice(7)}`;
            }
          }
        } catch {
          // skip
        }
      }
      const files = content.files as Array<{ type?: string; uri?: string }> | undefined;
      if (!image && files?.length) {
        const img = files.find((f) => f.type?.startsWith("image/") || f.uri?.match(/\.(png|jpg|jpeg|gif|webp)/i));
        if (img?.uri) {
          image = img.uri;
          if (image.startsWith("ipfs://")) {
            image = `https://ipfs.io/ipfs/${image.slice(7)}`;
          }
        }
      }
      if (!image) continue;
      const name = (metadata?.name || json?.name || (item?.id as string)?.slice(0, 8) || "NFT") as string;
      nfts.push({ image, name });
    }

    const message =
      nfts.length === 0 && items.length > 0
        ? "No NFT images could be loaded (metadata may be private or slow)."
        : nfts.length === 0
          ? `No NFTs found on ${base}. Most NFTs are on mainnet — we're already checking mainnet.`
          : undefined;

    return new Response(JSON.stringify({ nfts, message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[nfts]", err);
    return new Response(
      JSON.stringify({ nfts: [], error: err instanceof Error ? err.message : "Failed to fetch NFTs" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
