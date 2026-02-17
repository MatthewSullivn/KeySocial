const API_URL = process.env.NEXT_PUBLIC_TAPESTRY_API_URL || "https://api.usetapestry.dev/api/v1";
const SERVER_API_KEY = process.env.TAPESTRY_API_KEY || process.env.NEXT_PUBLIC_TAPESTRY_API_KEY || "";
const NAMESPACE = process.env.NEXT_PUBLIC_APP_NAMESPACE || "keysocial";
// No custom namespace for content — Tapestry uses its default.

interface TapestryProfile {
  id: string;
  username: string;
  bio: string;
  walletAddress: string;
  namespace: string;
  image?: string;
  blockchain: string;
  properties?: Record<string, string>;
  socialCounts?: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * The Tapestry API nests profile data under a `.profile` key and puts
 * walletAddress / socialCounts at the top level. This helper flattens
 * the response into a single TapestryProfile object.
 */
function unwrapProfile(data: Record<string, unknown>): TapestryProfile {
  const inner = (data.profile || data) as Record<string, unknown>;
  const wallet = data.walletAddress || data.wallet;
  const walletAddress =
    typeof wallet === "string"
      ? wallet
      : wallet && typeof wallet === "object" && "address" in (wallet as Record<string, unknown>)
      ? (wallet as Record<string, unknown>).address as string
      : (inner.walletAddress as string) || "";

  return {
    id: (inner.id as string) || "",
    username: (inner.username as string) || "",
    bio: (inner.bio as string) || "",
    walletAddress,
    namespace: typeof inner.namespace === "string" ? inner.namespace : "",
    image: (inner.image as string) || undefined,
    blockchain: (inner.blockchain as string) || "SOLANA",
    properties: (inner.customProperties || inner.properties || undefined) as
      | Record<string, string>
      | undefined,
    socialCounts: (data.socialCounts || inner.socialCounts || undefined) as
      | TapestryProfile["socialCounts"]
      | undefined,
    createdAt: (inner.created_at || inner.createdAt || undefined) as string | undefined,
    updatedAt: (inner.updated_at || inner.updatedAt || undefined) as string | undefined,
  };
}

interface TapestryContent {
  id: string;
  profileId: string;
  content: string;
  contentType: string;
  properties?: Record<string, string>;
  socialCounts?: {
    comments: number;
    likes: number;
  };
  hasLiked?: boolean;
  createdAt?: string;
  profile?: TapestryProfile;
}

interface TapestryComment {
  id: string;
  profileId: string;
  contentId: string;
  text: string;
  createdAt?: string;
  profile?: TapestryProfile;
}

async function tapestryFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // In the browser, use our Next.js proxy to avoid CORS + hide API key.
  const isBrowser = typeof window !== "undefined";
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = isBrowser
    ? `/api/tapestry${endpoint}`
    : `${API_URL}${endpoint}${separator}apiKey=${SERVER_API_KEY}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return response;
}

// ========================
// PROFILE OPERATIONS
// ========================

export async function findOrCreateProfile(
  walletAddress: string,
  username: string,
  bio: string = "",
  image: string = ""
): Promise<TapestryProfile> {
  const body: Record<string, unknown> = {
    walletAddress,
    username,
    bio,
    blockchain: "SOLANA",
    execution: "FAST_UNCONFIRMED",
    namespace: NAMESPACE,
  };

  if (image) {
    body.customProperties = [{ key: "image", value: image }];
  }

  const res = await tapestryFetch("/profiles/findOrCreate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create profile: ${error}`);
  }

  const data = await res.json();
  return unwrapProfile(data);
}

export async function getProfile(usernameOrId: string): Promise<TapestryProfile | null> {
  const res = await tapestryFetch(`/profiles/${usernameOrId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return unwrapProfile(data);
}

export async function updateProfile(
  profileId: string,
  updates: { username?: string; bio?: string; image?: string }
): Promise<TapestryProfile> {
  const body: Record<string, unknown> = {
    ...updates,
    blockchain: "SOLANA",
    execution: "FAST_UNCONFIRMED",
  };

  const res = await tapestryFetch(`/profiles/${profileId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

export async function getProfileByWallet(walletAddress: string): Promise<TapestryProfile | null> {
  try {
    const res = await tapestryFetch(`/profiles?walletAddress=${walletAddress}`);
    if (!res.ok) return null;
    const data = await res.json();
    const profiles = data.profiles as Record<string, unknown>[] | undefined;
    if (!profiles || profiles.length === 0) return null;
    return unwrapProfile(profiles[0]);
  } catch {
    return null;
  }
}

export async function searchProfiles(query: string): Promise<TapestryProfile[]> {
  const res = await tapestryFetch(`/search/profiles?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.profiles || data || [];
}

// ========================
// FOLLOW OPERATIONS
// ========================

export async function followProfile(followerId: string, followeeId: string): Promise<void> {
  const res = await tapestryFetch("/followers/add", {
    method: "POST",
    body: JSON.stringify({
      startId: followerId,
      endId: followeeId,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to follow");
}

export async function unfollowProfile(followerId: string, followeeId: string): Promise<void> {
  const res = await tapestryFetch("/followers/remove", {
    method: "POST",
    body: JSON.stringify({
      startId: followerId,
      endId: followeeId,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to unfollow");
}

export async function checkFollowStatus(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const res = await tapestryFetch(
    `/followers/state?followerId=${followerId}&followeeId=${followeeId}`
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data.isFollowing || false;
}

export async function getFollowers(
  profileId: string,
  limit = 20,
  offset = 0
): Promise<TapestryProfile[]> {
  const res = await tapestryFetch(
    `/profiles/${profileId}/followers?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.followers ?? data.profiles ?? data;
  return Array.isArray(list) ? list : [];
}

export async function getFollowing(
  profileId: string,
  limit = 20,
  offset = 0
): Promise<TapestryProfile[]> {
  const res = await tapestryFetch(
    `/profiles/${profileId}/following?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const list = data.following ?? data.profiles ?? data;
  return Array.isArray(list) ? list : [];
}

// ========================
// CONTENT OPERATIONS (Match Results & Posts)
// ========================

export async function createContent(
  profileId: string,
  content: string,
  contentType: string = "text",
  extraProperties: { key: string; value: string }[] = []
): Promise<TapestryContent> {
  const id = `ks-${profileId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const properties = [
    { key: "source", value: "keysocial" },
    { key: "text", value: content },
    { key: "contentType", value: contentType },
    ...extraProperties,
  ];

  const res = await tapestryFetch("/contents/findOrCreate", {
    method: "POST",
    body: JSON.stringify({
      id,
      profileId,
      content,
      contentType,
      properties,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to create content: ${errText}`);
  }
  return res.json();
}

export async function recordMatchResult(
  profileId: string,
  matchData: {
    winnerId: string;
    loserId: string;
    winnerUsername: string;
    loserUsername: string;
    winnerWPM: number;
    loserWPM: number;
    winnerAccuracy: number;
    loserAccuracy: number;
    stakeAmount: number;
    duration: number;
    matchType: string;
  }
): Promise<TapestryContent> {
  const content = `${matchData.winnerUsername} defeated ${matchData.loserUsername} in a KeySocial race! WPM: ${matchData.winnerWPM} vs ${matchData.loserWPM}`;

  const customProperties = [
    { key: "type", value: "match_result" },
    { key: "winnerId", value: matchData.winnerId },
    { key: "loserId", value: matchData.loserId },
    { key: "winnerUsername", value: matchData.winnerUsername },
    { key: "loserUsername", value: matchData.loserUsername },
    { key: "winnerWPM", value: String(matchData.winnerWPM) },
    { key: "loserWPM", value: String(matchData.loserWPM) },
    { key: "winnerAccuracy", value: String(matchData.winnerAccuracy) },
    { key: "loserAccuracy", value: String(matchData.loserAccuracy) },
    { key: "stakeAmount", value: String(matchData.stakeAmount) },
    { key: "duration", value: String(matchData.duration) },
    { key: "matchType", value: matchData.matchType },
  ];

  return createContent(profileId, content, "text", customProperties);
}

export async function getContents(
  limit = 20,
  offset = 0,
  requestingProfileId?: string
): Promise<TapestryContent[]> {
  let url = `/contents?limit=${limit}&offset=${offset}`;
  if (requestingProfileId) {
    url += `&requestingProfileId=${encodeURIComponent(requestingProfileId)}`;
  }
  const res = await tapestryFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const rawList = data.contents || data || [];

  return rawList.map((item: Record<string, unknown>) => {
    const c = (item.content || item) as Record<string, unknown>;
    const ap = (item.authorProfile || {}) as Record<string, unknown>;
    const sc = (item.socialCounts || {}) as Record<string, unknown>;
    const rpsi = (item.requestingProfileSocialInfo || {}) as Record<string, unknown>;

    // Tapestry stores properties as flat keys on the content node
    const text = (c.text || c.content || c.drop_name || c.title || "") as string;
    const contentType = (c.contentType || c.type || "text") as string;

    // Build a properties map from the flat content object
    const props: Record<string, string> = {};
    for (const [k, v] of Object.entries(c)) {
      if (typeof v === "string" && !["id", "namespace", "externalLinkURL"].includes(k)) {
        props[k] = v;
      }
    }

    return {
      id: (c.id as string) || "",
      profileId: (ap.id || "") as string,
      content: text,
      contentType,
      properties: Object.keys(props).length > 0 ? props : undefined,
      socialCounts: {
        likes: (sc.likeCount || sc.likes || 0) as number,
        comments: (sc.commentCount || sc.comments || 0) as number,
      },
      hasLiked: rpsi.hasLiked === true,
      createdAt: c.created_at
        ? typeof c.created_at === "number"
          ? new Date(c.created_at as number).toISOString()
          : String(c.created_at)
        : undefined,
      profile: ap.username
        ? {
            id: (ap.id as string) || "",
            username: (ap.username as string) || "",
            bio: (ap.bio as string) || "",
            walletAddress: "",
            namespace: (ap.namespace as string) || "",
            image: (ap.image as string) || undefined,
            blockchain: "SOLANA",
          }
        : undefined,
    } as TapestryContent;
  });
}

export async function getContentById(contentId: string): Promise<TapestryContent | null> {
  const res = await tapestryFetch(`/contents/${contentId}`);
  if (!res.ok) return null;
  return res.json();
}

// ========================
// LIKES
// ========================

export async function likeContent(nodeId: string, profileId: string): Promise<void> {
  const res = await tapestryFetch(`/likes/${nodeId}`, {
    method: "POST",
    body: JSON.stringify({
      startId: profileId,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to like");
}

export async function unlikeContent(nodeId: string, profileId: string): Promise<void> {
  const res = await tapestryFetch(`/likes/${nodeId}`, {
    method: "DELETE",
    body: JSON.stringify({
      startId: profileId,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to unlike");
}

// ========================
// COMMENTS
// ========================

export async function createComment(
  profileId: string,
  contentId: string,
  text: string
): Promise<TapestryComment> {
  const res = await tapestryFetch("/comments/", {
    method: "POST",
    body: JSON.stringify({
      profileId,
      contentId,
      text,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function getComments(
  contentId: string,
  limit = 20,
  offset = 0
): Promise<TapestryComment[]> {
  const res = await tapestryFetch(
    `/comments/?contentId=${contentId}&limit=${limit}&offset=${offset}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const rawList = data.comments || data || [];

  return rawList.map((item: Record<string, unknown>) => {
    const c = (item.comment || item) as Record<string, unknown>;
    const author = (item.author || item.profile || {}) as Record<string, unknown>;

    return {
      id: (c.id as string) || `comment-${Math.random()}`,
      profileId: (author.id as string) || "",
      contentId,
      text: (c.text as string) || "",
      createdAt: c.created_at
        ? typeof c.created_at === "number"
          ? new Date(c.created_at as number).toISOString()
          : String(c.created_at)
        : new Date().toISOString(),
      profile: author.username
        ? {
            id: (author.id as string) || "",
            username: (author.username as string) || "",
            bio: (author.bio as string) || "",
            walletAddress: "",
            namespace: (author.namespace as string) || "",
            blockchain: "SOLANA",
          }
        : undefined,
    } as TapestryComment;
  });
}

// ========================
// DELETE OPERATIONS
// ========================

export async function deleteContent(contentId: string): Promise<void> {
  const res = await tapestryFetch("/contents/delete", {
    method: "POST",
    body: JSON.stringify({
      id: contentId,
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to delete content");
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await tapestryFetch(`/comments/${commentId}`, {
    method: "DELETE",
    body: JSON.stringify({
      blockchain: "SOLANA",
      execution: "FAST_UNCONFIRMED",
    }),
  });

  if (!res.ok) throw new Error("Failed to delete comment");
}

// ========================
// LEADERBOARD
// ========================

export async function getLeaderboard(): Promise<TapestryContent[]> {
  // Fetch match results and aggregate wins
  return getContents(100, 0);
}

// Export types
export type { TapestryProfile, TapestryContent, TapestryComment };
