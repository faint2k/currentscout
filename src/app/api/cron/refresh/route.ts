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
import { rankPosts } from "../../../../lib/ranking/scorer";
import { SUBREDDIT_NAMES } from "../../../../lib/utils/subreddits";
import type { RedditPost } from "../../../../lib/reddit/types";

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

    let raw: RedditPost[] = await fetchMultipleSubreddits(SUBREDDIT_NAMES, {
      sort: "hot", limit: 25,
    });

    // Also pull rising from tier-1 subs to catch early movers
    const tier1 = SUBREDDIT_NAMES.slice(0, 7);
    const rising = await fetchMultipleSubreddits(tier1, { sort: "rising", limit: 15 });
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
            const [hot, risingPosts, top] = await Promise.all([
              fetchSubredditPosts(sub, { sort: "hot",    limit: 25 }),
              fetchSubredditPosts(sub, { sort: "rising", limit: 15 }),
              fetchSubredditPosts(sub, { sort: "top",    limit: 15, t: "day" }),
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
