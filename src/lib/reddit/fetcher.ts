/**
 * fetcher.ts — Higher-level feed assembly
 *
 * Composes the Reddit client, cache, ranker, and mock fallback into
 * the feed endpoints consumed by API routes.
 */

import { fetchMultipleSubreddits, fetchSubredditPosts } from "./client";
import { rankPosts } from "../ranking/scorer";
import { cache } from "../cache/store";
import { SUBREDDIT_NAMES } from "../utils/subreddits";
import { getMockPosts } from "../../data/mock";
import type { RankedPost } from "./types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Overview feed (all subreddits) ──────────────────────────────────────────

export async function fetchOverviewFeed(
  subreddits: string[] = SUBREDDIT_NAMES
): Promise<{ posts: RankedPost[]; cached: boolean; fetchedAt: number; sources: string[] }> {
  const cacheKey = `overview:${subreddits.sort().join(",")}`;
  const hit = cache.get<RankedPost[]>(cacheKey);

  if (hit) {
    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp, sources: subreddits };
  }

  let raw = await fetchMultipleSubreddits(subreddits, { sort: "hot", limit: 25 });

  // Also fetch "rising" for a subset of top-tier subs to capture early movers
  const tier1 = subreddits.slice(0, 7);
  const rising = await fetchMultipleSubreddits(tier1, { sort: "rising", limit: 15 });
  raw = [...raw, ...rising];

  // Fallback to mock data if API is completely down
  if (raw.length === 0) {
    console.warn("[fetcher] No posts from Reddit API — using mock data");
    const mockPosts = getMockPosts();
    const ranked = rankPosts(mockPosts);
    return { posts: ranked, cached: false, fetchedAt: Date.now(), sources: [] };
  }

  const ranked = rankPosts(raw);
  cache.set(cacheKey, ranked, CACHE_TTL_MS);

  return {
    posts:     ranked,
    cached:    false,
    fetchedAt: Date.now(),
    sources:   subreddits,
  };
}

// ─── Single subreddit feed ────────────────────────────────────────────────────

export async function fetchSubredditFeed(
  subreddit: string
): Promise<{ posts: RankedPost[]; cached: boolean; fetchedAt: number }> {
  const cacheKey = `sub:${subreddit.toLowerCase()}`;
  const hit = cache.get<RankedPost[]>(cacheKey);

  if (hit) {
    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp };
  }

  const [hot, rising, top] = await Promise.all([
    fetchSubredditPosts(subreddit, { sort: "hot",    limit: 25 }),
    fetchSubredditPosts(subreddit, { sort: "rising", limit: 15 }),
    fetchSubredditPosts(subreddit, { sort: "top",    limit: 15, t: "day" }),
  ]);

  let raw = [...hot, ...rising, ...top];

  if (raw.length === 0) {
    const mockPosts = getMockPosts().filter(
      (p) => p.subreddit.toLowerCase() === subreddit.toLowerCase()
    );
    return { posts: rankPosts(mockPosts), cached: false, fetchedAt: Date.now() };
  }

  // Deduplicate
  const seen = new Set<string>();
  raw = raw.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  const ranked = rankPosts(raw);
  cache.set(cacheKey, ranked, CACHE_TTL_MS);

  return { posts: ranked, cached: false, fetchedAt: Date.now() };
}
