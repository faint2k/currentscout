/**
 * client.ts — Free Reddit data ingestion
 *
 * Strategy: Reddit's public JSON API requires no authentication for read-only
 * access to public subreddits.  Each subreddit exposes:
 *   https://www.reddit.com/r/{sub}/{sort}.json?limit=25&raw_json=1
 *
 * Rate limits (unauthenticated):
 *   ~60 requests / minute.  We batch fetches and cache aggressively (15 min TTL).
 *
 * Fallback: MOCK_DATA in data/mock.ts is returned when the Reddit API is
 * unavailable (network error, rate-limited, or during SSR/testing).
 */

import type { RedditPost, RedditListing } from "./types";

const BASE_URL = "https://www.reddit.com";

/** Browser-like UA avoids most 429s on the public API */
const USER_AGENT =
  "Mozilla/5.0 (compatible; AIHub/1.0; +https://github.com/aihub)";

export type RedditSort = "hot" | "new" | "rising" | "top";

export interface FetchSubredditOptions {
  sort?:   RedditSort;
  limit?:  number;
  after?:  string;
  t?:      "hour" | "day" | "week" | "month" | "year" | "all"; // for top
}

/**
 * Fetch posts from a single subreddit using Reddit's free JSON API.
 * Returns an empty array on any error so callers can continue gracefully.
 */
export async function fetchSubredditPosts(
  subreddit: string,
  options: FetchSubredditOptions = {}
): Promise<RedditPost[]> {
  const { sort = "hot", limit = 25, after, t = "day" } = options;

  const params = new URLSearchParams({
    limit:    String(limit),
    raw_json: "1",
  });
  if (after) params.set("after", after);
  if (sort === "top") params.set("t", t);

  const url = `${BASE_URL}/r/${subreddit}/${sort}.json?${params}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:       "application/json",
      },
      next: { revalidate: 900 }, // Next.js ISR: cache 15 minutes
    });

    if (!res.ok) {
      console.warn(`[reddit] ${subreddit} returned ${res.status}`);
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

/**
 * Fetch from multiple subreddits concurrently, with a small stagger to be
 * polite to the free API.  Each subreddit may contribute posts from "hot"
 * and "rising" so fresh + trending content is both captured.
 */
export async function fetchMultipleSubreddits(
  subreddits: string[],
  options: FetchSubredditOptions = {}
): Promise<RedditPost[]> {
  // Stagger requests in batches of 5 to avoid burst rate-limiting
  const BATCH_SIZE = 5;
  const all: RedditPost[] = [];

  for (let i = 0; i < subreddits.length; i += BATCH_SIZE) {
    const batch = subreddits.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((sub) => fetchSubredditPosts(sub, options))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        all.push(...result.value);
      }
    }

    // Small delay between batches to be rate-limit friendly
    if (i + BATCH_SIZE < subreddits.length) {
      await new Promise((r) => setTimeout(r, 200));
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
