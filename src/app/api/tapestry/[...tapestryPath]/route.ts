import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

  const upstream = await fetch(upstreamUrl.toString(), init);

  const respHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) respHeaders.set("content-type", upstreamContentType);

  return new Response(upstream.body, {
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
