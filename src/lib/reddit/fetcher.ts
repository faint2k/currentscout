/**
 * fetcher.ts — Feed assembly for user-facing API routes
 *
 * Read order (never touches Reddit on user requests):
 *   1. Upstash Redis   — populated every 15 min by GitHub Actions cron
 *   2. Live Reddit fetch — only if Redis is empty (cold start / first deploy)
 *   3. Mock data        — only if Reddit API is also unreachable
 *
 * This means Reddit is called at most once per 15-min window regardless of
 * how many users are on the site.
 */

import { fetchMultipleSubreddits, fetchSubredditPosts } from "./client";
import { fetchMultipleSubredditsRSS, fetchSubredditRSS } from "./rss";
import { rankPosts } from "../ranking/scorer";
import { cache } from "../cache/store";
import { SUBREDDIT_NAMES } from "../utils/subreddits";
import { getMockPosts } from "../../data/mock";
import type { RankedPost } from "./types";

const CACHE_TTL_MS  = 20 * 60 * 1000; // 20 min — outlasts 15-min cron cycle
const OVERVIEW_KEY  = (subs: string[]) => `overview:${[...subs].sort().join(",")}`;
const SUB_KEY       = (name: string)   => `sub:${name.toLowerCase()}`;

// ─── Overview feed ────────────────────────────────────────────────────────────

export async function fetchOverviewFeed(
  subreddits: string[] = SUBREDDIT_NAMES
): Promise<{ posts: RankedPost[]; cached: boolean; fetchedAt: number; sources: string[] }> {
  // 1. Redis hit (normal path — cron has pre-populated this)
  const hit = await cache.get<RankedPost[]>(OVERVIEW_KEY(subreddits));
  if (hit) {
    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp, sources: subreddits };
  }

  // 2. Cold-start: Redis empty — try JSON API then RSS, write result to Redis
  console.warn("[fetcher] Redis cold start — fetching directly (one-time)");

  let raw = await fetchMultipleSubreddits(subreddits, { sort: "hot", limit: 25 });

  // JSON API blocked? Fall back to RSS
  if (raw.length === 0) {
    console.warn("[fetcher] JSON API failed — trying RSS fallback");
    raw = await fetchMultipleSubredditsRSS(subreddits, "hot", 25);
  }

  const rising = raw.length > 0
    ? await fetchMultipleSubredditsRSS(subreddits.slice(0, 7), "rising", 15)
    : [];
  raw = [...raw, ...rising];

  // 3. Mock fallback — both JSON and RSS unreachable
  if (raw.length === 0) {
    console.warn("[fetcher] All sources failed — serving mock data");
    return {
      posts:     rankPosts(getMockPosts()),
      cached:    false,
      fetchedAt: Date.now(),
      sources:   [],
    };
  }

  const seen = new Set<string>();
  raw = raw.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  const ranked = rankPosts(raw);
  await cache.set(OVERVIEW_KEY(subreddits), ranked, CACHE_TTL_MS);

  return { posts: ranked, cached: false, fetchedAt: Date.now(), sources: subreddits };
}

// ─── Single subreddit feed ────────────────────────────────────────────────────

export async function fetchSubredditFeed(
  subreddit: string
): Promise<{ posts: RankedPost[]; cached: boolean; fetchedAt: number }> {
  // 1. Redis hit
  const hit = await cache.get<RankedPost[]>(SUB_KEY(subreddit));
  if (hit) {
    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp };
  }

  // 2. Cold-start live fetch — JSON then RSS
  console.warn(`[fetcher] Redis cold start for r/${subreddit} — fetching directly`);

  const fetchSorted = async (sort: "hot" | "rising" | "top", limit: number) => {
    const json = await fetchSubredditPosts(subreddit, { sort, limit, t: "day" });
    if (json.length > 0) return json;
    return fetchSubredditRSS(subreddit, sort === "top" ? "hot" : sort, limit);
  };

  const [hot, risingPosts, top] = await Promise.all([
    fetchSorted("hot",    25),
    fetchSorted("rising", 15),
    fetchSorted("top",    15),
  ]);

  let raw = [...hot, ...risingPosts, ...top];

  // 3. Mock fallback
  if (raw.length === 0) {
    const mock = getMockPosts().filter(
      (p) => p.subreddit.toLowerCase() === subreddit.toLowerCase()
    );
    return { posts: rankPosts(mock), cached: false, fetchedAt: Date.now() };
  }

  const seen = new Set<string>();
  raw = raw.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  const ranked = rankPosts(raw);
  await cache.set(SUB_KEY(subreddit), ranked, CACHE_TTL_MS);

  return { posts: ranked, cached: false, fetchedAt: Date.now() };
}
