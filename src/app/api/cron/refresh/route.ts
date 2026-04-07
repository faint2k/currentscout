/**
 * GET /api/cron/refresh
 *
 * Called by GitHub Actions every 15 minutes.
 * Fetches all subreddits from Reddit, ranks posts, and writes results
 * to Upstash Redis. User-facing API routes then read from Redis only —
 * Reddit is never touched by user requests.
 *
 * Protected by CRON_SECRET env var (Bearer token).
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleSubreddits, fetchSubredditPosts } from "../../../../lib/reddit/client";
import { fetchMultipleSubredditsRSS, fetchSubredditRSS } from "../../../../lib/reddit/rss";
import { rankPosts } from "../../../../lib/ranking/scorer";
import { SUBREDDIT_NAMES } from "../../../../lib/utils/subreddits";
import type { RedditPost } from "../../../../lib/reddit/types";

/** Try JSON API first, fall back to RSS if it returns nothing */
async function fetchWithFallback(
  subreddits: string[],
  sort: "hot" | "rising" = "hot",
  limit: number
): Promise<{ posts: RedditPost[]; source: "json" | "rss" }> {
  const jsonPosts = await fetchMultipleSubreddits(subreddits, { sort, limit });
  if (jsonPosts.length > 0) return { posts: jsonPosts, source: "json" };

  console.warn(`[cron] JSON API returned 0 posts for ${sort} — falling back to RSS`);
  const rssPosts = await fetchMultipleSubredditsRSS(subreddits, sort, limit);
  return { posts: rssPosts, source: "rss" };
}

const CACHE_TTL_MS = 20 * 60 * 1000; // 20 min — slightly longer than the 15-min refresh cycle

async function writeToRedis(key: string, value: unknown, ttlMs: number): Promise<boolean> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("[cron] No Upstash credentials — skipping Redis write");
    return false;
  }

  const ttlSeconds = Math.ceil(ttlMs / 1000);
  const res = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: JSON.stringify({ value, timestamp: Date.now(), expiresAt: Date.now() + ttlMs }),
      ex: ttlSeconds,
    }),
    cache: "no-store",
  });

  return res.ok;
}

export async function GET(req: NextRequest) {
  // ── Auth check ───────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const startedAt = Date.now();
  const results: Record<string, number> = {};
  let totalPosts = 0;

  try {
    // ── 1. Overview feed (all subreddits combined) ────────────────────────
    console.log("[cron] Fetching overview feed…");

    const { posts: hotPosts, source: hotSource } = await fetchWithFallback(SUBREDDIT_NAMES, "hot", 25);
    console.log(`[cron] Hot feed: ${hotPosts.length} posts via ${hotSource}`);

    const tier1 = SUBREDDIT_NAMES.slice(0, 7);
    const { posts: rising } = await fetchWithFallback(tier1, "rising", 15);

    let raw: RedditPost[] = [...hotPosts, ...rising];
    raw = [...raw, ...rising];

    // Deduplicate
    const seen = new Set<string>();
    raw = raw.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

    if (raw.length > 0) {
      const ranked = rankPosts(raw);
      const overviewKey = `overview:${[...SUBREDDIT_NAMES].sort().join(",")}`;
      await writeToRedis(overviewKey, ranked, CACHE_TTL_MS);
      results["overview"] = ranked.length;
      totalPosts += ranked.length;
      console.log(`[cron] Overview: ${ranked.length} ranked posts written to Redis`);
    }

    // ── 2. Per-subreddit feeds ────────────────────────────────────────────
    // Refresh the top-tier subreddits individually so their dedicated pages
    // also show live data. Do them in small batches to stay within rate limits.
    const PRIORITY_SUBS = SUBREDDIT_NAMES.slice(0, 15);
    const BATCH_SIZE = 3;

    for (let i = 0; i < PRIORITY_SUBS.length; i += BATCH_SIZE) {
      const batch = PRIORITY_SUBS.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            // Try JSON API, fall back to RSS per-sort
            const fetchSorted = async (sort: "hot" | "rising" | "top", limit: number) => {
              const json = await fetchSubredditPosts(sub, { sort, limit, t: "day" });
              if (json.length > 0) return json;
              return fetchSubredditRSS(sub, sort === "top" ? "hot" : sort, limit);
            };

            const [hot, risingPosts, top] = await Promise.all([
              fetchSorted("hot",    25),
              fetchSorted("rising", 15),
              fetchSorted("top",    15),
            ]);

            let subRaw = [...hot, ...risingPosts, ...top];
            const subSeen = new Set<string>();
            subRaw = subRaw.filter((p) => {
              if (subSeen.has(p.id)) return false;
              subSeen.add(p.id);
              return true;
            });

            if (subRaw.length > 0) {
              const ranked = rankPosts(subRaw);
              await writeToRedis(`sub:${sub.toLowerCase()}`, ranked, CACHE_TTL_MS);
              results[sub] = ranked.length;
              totalPosts += ranked.length;
            }
          } catch (err) {
            console.warn(`[cron] Failed to refresh r/${sub}:`, err);
          }
        })
      );

      // Pause between batches
      if (i + BATCH_SIZE < PRIORITY_SUBS.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const elapsed = Date.now() - startedAt;
    console.log(`[cron] Done in ${elapsed}ms — ${totalPosts} total posts across ${Object.keys(results).length} feeds`);

    return NextResponse.json({
      ok:          true,
      elapsed_ms:  elapsed,
      total_posts: totalPosts,
      feeds:       results,
      refreshed_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[cron] Refresh failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
