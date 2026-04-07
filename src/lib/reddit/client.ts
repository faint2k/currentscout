/**
 * client.ts — Free Reddit data ingestion
 *
 * Two access modes (automatic fallback):
 *
 * 1. OAuth (preferred) — uses a free Reddit "script" app to get a bearer token.
 *    Set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET in env vars.
 *    Gives 100 req/min and works reliably from Vercel/cloud IPs.
 *
 * 2. Public JSON (fallback) — no auth needed, but Reddit blocks many cloud IPs.
 *    Works locally; may 403 on Vercel without OAuth credentials.
 *
 * Fallback chain: OAuth → Public JSON → Mock data (in fetcher.ts)
 */

import type { RedditPost, RedditListing } from "./types";

const PUBLIC_BASE  = "https://www.reddit.com";
const OAUTH_BASE   = "https://oauth.reddit.com";
const TOKEN_URL    = "https://www.reddit.com/api/v1/access_token";
const APP_USER_AGENT = "web:aihub:v1.0 (by /u/aihub_bot)";

export type RedditSort = "hot" | "new" | "rising" | "top";

export interface FetchSubredditOptions {
  sort?:  RedditSort;
  limit?: number;
  after?: string;
  t?:     "hour" | "day" | "week" | "month" | "year" | "all";
}

// ─── OAuth token cache (module-level, survives warm function invocations) ─────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getOAuthToken(): Promise<string | null> {
  const clientId     = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "User-Agent":  APP_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.warn("[reddit] OAuth token request failed:", res.status);
      return null;
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    cachedToken    = data.access_token;
    tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return cachedToken;
  } catch (err) {
    console.warn("[reddit] OAuth token error:", err);
    return null;
  }
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function fetchSubredditPosts(
  subreddit: string,
  options: FetchSubredditOptions = {}
): Promise<RedditPost[]> {
  const { sort = "hot", limit = 25, after, t = "day" } = options;

  const params = new URLSearchParams({ limit: String(limit), raw_json: "1" });
  if (after) params.set("after", after);
  if (sort === "top") params.set("t", t);

  // Try OAuth first (works from cloud IPs), fall back to public endpoint
  const token = await getOAuthToken();
  const baseUrl = token ? OAUTH_BASE : PUBLIC_BASE;
  const url     = `${baseUrl}/r/${subreddit}/${sort}.json?${params}`;

  const headers: Record<string, string> = {
    "User-Agent": APP_USER_AGENT,
    Accept:       "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers,
      // Next.js 16: use cache option instead of next.revalidate inside fetch
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[reddit] r/${subreddit} ${sort} → HTTP ${res.status}`);
      return [];
    }

    const json = (await res.json()) as RedditListing<RedditPost>;
    return json.data.children
      .map((c) => c.data)
      .filter((p) => !p.stickied && !p.over_18);
  } catch (err) {
    console.warn(`[reddit] fetch failed for r/${subreddit}:`, err);
    return [];
  }
}

export async function fetchMultipleSubreddits(
  subreddits: string[],
  options: FetchSubredditOptions = {}
): Promise<RedditPost[]> {
  const BATCH_SIZE = 5;
  const all: RedditPost[] = [];

  for (let i = 0; i < subreddits.length; i += BATCH_SIZE) {
    const batch = subreddits.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((sub) => fetchSubredditPosts(sub, options))
    );

    for (const result of results) {
      if (result.status === "fulfilled") all.push(...result.value);
    }

    if (i + BATCH_SIZE < subreddits.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  // Deduplicate by post id
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
