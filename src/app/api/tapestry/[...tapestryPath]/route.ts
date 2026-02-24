import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const CONTENTS_CACHE_TTL_MS = 5_000; // 5 seconds — short so match history updates quickly after races
const contentsCache = new Map<string, { body: ArrayBuffer; contentType: string | null; ts: number }>();

function getBaseUrl() {
  return (
    process.env.TAPESTRY_API_URL ||
    process.env.NEXT_PUBLIC_TAPESTRY_API_URL ||
    "https://api.usetapestry.dev/api/v1"
  ).replace(/\/+$/, "");
}

function getApiKey() {
  return process.env.TAPESTRY_API_KEY || "";
}

async function proxy(req: NextRequest, tapestryPath: string[]) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return new Response("Missing TAPESTRY_API_KEY on server", { status: 500 });
  }

  const base = getBaseUrl();
  const upstreamUrl = new URL(`${base}/${tapestryPath.join("/")}`);

  // Copy query params from the client request (but never let the client set apiKey).
  req.nextUrl.searchParams.forEach((v, k) => {
    if (k.toLowerCase() === "apikey") return;
    upstreamUrl.searchParams.append(k, v);
  });
  upstreamUrl.searchParams.set("apiKey", apiKey);

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const method = req.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
  }

  const isContentsGet =
    method === "GET" &&
    tapestryPath[0] === "contents" &&
    tapestryPath.length === 1;
  const cacheKey = isContentsGet ? upstreamUrl.toString() : null;

  if (cacheKey) {
    const now = Date.now();
    for (const [k, v] of contentsCache) {
      if (now - v.ts > CONTENTS_CACHE_TTL_MS) contentsCache.delete(k);
    }
    const hit = contentsCache.get(cacheKey);
    if (hit && now - hit.ts < CONTENTS_CACHE_TTL_MS) {
      const respHeaders = new Headers();
      if (hit.contentType) respHeaders.set("content-type", hit.contentType);
      respHeaders.set("x-cache", "HIT");
      return new Response(hit.body, { status: 200, headers: respHeaders });
    }
  }

  const upstream = await fetch(upstreamUrl.toString(), init);

  // Invalidate contents cache when content is created so match history updates immediately
  if (method === "POST" && tapestryPath[0] === "contents" && upstream.ok) {
    contentsCache.clear();
  }

  let responseBody: BodyInit = upstream.body ?? new Uint8Array();
  if (cacheKey && upstream.ok) {
    const body = await upstream.arrayBuffer();
    contentsCache.set(cacheKey, {
      body,
      contentType: upstream.headers.get("content-type"),
      ts: Date.now(),
    });
    responseBody = body;
  }

  const respHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) respHeaders.set("content-type", upstreamContentType);
  if (cacheKey) respHeaders.set("x-cache", "MISS");

  return new Response(responseBody, {
    status: upstream.status,
    headers: respHeaders,
  });
}

type RouteCtx = { params: Promise<{ tapestryPath: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { tapestryPath } = await ctx.params;
  return proxy(req, tapestryPath);
}
export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { tapestryPath } = await ctx.params;
  return proxy(req, tapestryPath);
}
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { tapestryPath } = await ctx.params;
  return proxy(req, tapestryPath);
}
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { tapestryPath } = await ctx.params;
  return proxy(req, tapestryPath);
}
