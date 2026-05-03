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
import { enrichWithThreadContext } from "./comments";
import { rankPosts, rankPostsFallback } from "../ranking/scorer";
import { cache } from "../cache/store";
import { SUBREDDIT_NAMES } from "../utils/subreddits";
import { getMockPosts } from "../../data/mock";
import type { RankedPost } from "./types";

const CACHE_TTL_MS  = 20 * 60 * 1000; // 20 min — outlasts 15-min cron cycle
const OVERVIEW_KEY  = (subs: string[]) => `overview:${[...subs].sort().join(",")}`;
const SUB_KEY       = (name: string)   => `sub:${name.toLowerCase()}`;

function shouldRepairCachedRssFeed(posts: RankedPost[]): boolean {
  const topRss = posts.filter((post) => post.dataSource === "rss").slice(0, 8);
  if (topRss.length < 4) return false;

  const hasDiscussion = topRss.some(
    (post) => (post.num_comments || 0) > 0 || Boolean(post.topComment),
  );

  return !hasDiscussion;
}

async function repairCachedRssFeed(posts: RankedPost[], limit = 12): Promise<RankedPost[]> {
  const repaired = posts.map((post) => ({ ...post }));
  await enrichWithThreadContext(repaired, limit);
  return rankPostsFallback(repaired);
}

// ─── Overview feed ────────────────────────────────────────────────────────────

export async function fetchOverviewFeed(
  subreddits: string[] = SUBREDDIT_NAMES
): Promise<{ posts: RankedPost[]; cached: boolean; fetchedAt: number; sources: string[] }> {
  // 1. Redis hit (normal path — cron has pre-populated this)
  const hit = await cache.get<RankedPost[]>(OVERVIEW_KEY(subreddits));
  if (hit) {
    if (shouldRepairCachedRssFeed(hit.value)) {
      const repaired = await repairCachedRssFeed(hit.value, 12);
      await cache.set(OVERVIEW_KEY(subreddits), repaired, CACHE_TTL_MS);
      return { posts: repaired, cached: true, fetchedAt: hit.timestamp, sources: subreddits };
    }

    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp, sources: subreddits };
  }

  // 2. Cold-start: Redis empty — try JSON API then RSS, write result to Redis
  console.warn("[fetcher] Redis cold start — fetching directly (one-time)");

  // Restore membership snapshot if available (populated by cron)
  try {
    const { importSnapshot, initStaticFallbacks } = await import("../utils/membershipStore");
    const { SUBREDDITS } = await import("../utils/subreddits");
    initStaticFallbacks(SUBREDDITS);

    const memberSnapshot = await cache.get<Record<string, import("../utils/membershipStore").SubredditMembership>>("membership:snapshot");
    if (memberSnapshot) {
      importSnapshot(memberSnapshot.value);
      console.log("[fetcher] Loaded membership snapshot from cache");
    }
  } catch {
    // Non-fatal — static fallbacks remain active
  }

  // FORCE_RSS_MODE=true in .env.local bypasses the public JSON API so that
  // local dev previews reflect the same RankPostFallback/RSS path that runs
  // on Vercel (where Reddit blocks datacenter IPs and JSON API returns nothing).
  const forceRSS = process.env.FORCE_RSS_MODE === "true";

  let raw = forceRSS
    ? []
    : await fetchMultipleSubreddits(subreddits, { sort: "hot", limit: 25 });
  let isRSS = forceRSS;

  // JSON API blocked (or forced off)? Fall back to RSS
  if (raw.length === 0) {
    if (!forceRSS) console.warn("[fetcher] JSON API failed — using RSS fallback (limited data)");
    else           console.warn("[fetcher] FORCE_RSS_MODE=true — using RSS path directly");
    raw    = await fetchMultipleSubredditsRSS(subreddits, "hot", 25);
    isRSS  = true;
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

  // Cold-start: Reddit only — HN is fetched by the cron job, not here.
  // Fetching HN in a user-facing request would blow the function timeout.
  let ranked = isRSS ? rankPostsFallback(raw) : rankPosts(raw);
  if (isRSS) {
    await enrichWithThreadContext(ranked, 12);
    ranked = rankPostsFallback(ranked);
  }
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
    if (shouldRepairCachedRssFeed(hit.value)) {
      const repaired = await repairCachedRssFeed(hit.value, 12);
      await cache.set(SUB_KEY(subreddit), repaired, CACHE_TTL_MS);
      return { posts: repaired, cached: true, fetchedAt: hit.timestamp };
    }

    return { posts: hit.value, cached: true, fetchedAt: hit.timestamp };
  }

  // 2. Cold-start live fetch — JSON then RSS
  console.warn(`[fetcher] Redis cold start for r/${subreddit} — fetching directly`);

  const fetchSorted = async (sort: "hot" | "rising" | "top", limit: number) => {
    const json = await fetchSubredditPosts(subreddit, { sort, limit, t: "day" });
    if (json.length > 0) return { posts: json, source: "json" as const };

    const rss = await fetchSubredditRSS(subreddit, sort === "top" ? "hot" : sort, limit);
    if (rss.length > 0) return { posts: rss, source: "rss" as const };

    return { posts: [] as RankedPost[], source: "empty" as const };
  };

  const [hot, risingPosts, top] = await Promise.all([
    fetchSorted("hot",    25),
    fetchSorted("rising", 15),
    fetchSorted("top",    15),
  ]);

  let raw = [...hot.posts, ...risingPosts.posts, ...top.posts];

  // 3. Mock fallback
  if (raw.length === 0) {
    const mock = getMockPosts().filter(
      (p) => p.subreddit.toLowerCase() === subreddit.toLowerCase()
    );
    return { posts: rankPosts(mock), cached: false, fetchedAt: Date.now() };
  }

  const seen = new Set<string>();
  raw = raw.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

  const isRSSSub = hot.source !== "json" && risingPosts.source !== "json" && top.source !== "json";

  let ranked = isRSSSub ? rankPostsFallback(raw) : rankPosts(raw);
  if (isRSSSub) {
    await enrichWithThreadContext(ranked, 12);
    ranked = rankPostsFallback(ranked);
  }

  await cache.set(SUB_KEY(subreddit), ranked, CACHE_TTL_MS);

  return { posts: ranked, cached: false, fetchedAt: Date.now() };
}
