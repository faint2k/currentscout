/**
 * GET /api/cron/refresh
 *
 * Called by GitHub Actions every 15 minutes.
 * Fetches all subreddits from Reddit (JSON → RSS fallback), ranks posts,
 * and writes results to Upstash Redis via the shared cache module.
 *
 * Protected by CRON_SECRET env var (Bearer token).
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchMultipleSubreddits, fetchSubredditPosts } from "../../../../lib/reddit/client";
import { fetchMultipleSubredditsRSS, fetchSubredditRSS } from "../../../../lib/reddit/rss";
import { rankPosts, rankPostsFallback } from "../../../../lib/ranking/scorer";
import { fetchHNPosts } from "../../../../lib/hackernews/fetcher";
import { cache } from "../../../../lib/cache/store";
import { SUBREDDIT_NAMES } from "../../../../lib/utils/subreddits";
import type { RankedPost, RedditPost } from "../../../../lib/reddit/types";

const CACHE_TTL_MS  = 20 * 60 * 1000;
const OVERVIEW_KEY  = `overview:${[...SUBREDDIT_NAMES].sort().join(",")}`;
const SUB_KEY       = (name: string) => `sub:${name.toLowerCase()}`;

/** Try JSON API first, fall back to RSS if it returns nothing */
async function fetchWithFallback(
  subreddits: string[],
  sort: "hot" | "rising",
  limit: number
): Promise<{ posts: RedditPost[]; source: "json" | "rss" | "empty" }> {
  const jsonPosts = await fetchMultipleSubreddits(subreddits, { sort, limit });
  if (jsonPosts.length > 0) return { posts: jsonPosts, source: "json" };

  console.warn(`[cron] JSON API returned 0 for ${sort} — trying RSS`);
  const rssPosts = await fetchMultipleSubredditsRSS(subreddits, sort, limit);
  if (rssPosts.length > 0) return { posts: rssPosts, source: "rss" };

  return { posts: [], source: "empty" };
}

function dedup(posts: RedditPost[]): RedditPost[] {
  const seen = new Set<string>();
  return posts.filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
}

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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
    // ── 1. Overview feed ─────────────────────────────────────────────────────
    console.log("[cron] Fetching overview feed…");

    // Fetch Reddit + HN in parallel
    const [
      { posts: hot,    source: hotSrc    },
      { posts: rising, source: risingSrc },
      hnRaw,
    ] = await Promise.all([
      fetchWithFallback(SUBREDDIT_NAMES, "hot",    25),
      fetchWithFallback(SUBREDDIT_NAMES.slice(0, 7), "rising", 15),
      fetchHNPosts(),
    ]);

    console.log(`[cron] hot=${hot.length}(${hotSrc}) rising=${rising.length}(${risingSrc}) hn=${hnRaw.length}`);

    const raw = dedup([...hot, ...rising]);

    if (raw.length > 0 || hnRaw.length > 0) {
      const redditRanked = (hotSrc === "rss" && risingSrc !== "json")
        ? rankPostsFallback(raw)
        : rankPosts(raw);
      const hnRanked = rankPosts(hnRaw);  // HN always has real data

      // Merge, dedup cross-source by url, sort by final score
      const seenUrls = new Set<string>();
      const merged: RankedPost[] = [];
      for (const post of [...redditRanked, ...hnRanked]) {
        const key = post.source === "hn" ? post.url : post.id;
        if (seenUrls.has(key)) continue;
        seenUrls.add(key);
        merged.push(post);
      }
      const ranked = merged.sort((a, b) => b.scores.final - a.scores.final);

      await cache.set(OVERVIEW_KEY, ranked, CACHE_TTL_MS);
      results["overview"] = ranked.length;
      results["hn"]       = hnRanked.length;
      totalPosts += ranked.length;
      console.log(`[cron] Overview: ${ranked.length} posts (${hnRanked.length} from HN) written to Redis`);
    } else {
      console.warn("[cron] Overview: 0 posts fetched — Redis not updated");
    }

    // ── 2. Per-subreddit feeds (top 15) ──────────────────────────────────────
    const PRIORITY_SUBS = SUBREDDIT_NAMES.slice(0, 15);
    const BATCH_SIZE    = 3;

    for (let i = 0; i < PRIORITY_SUBS.length; i += BATCH_SIZE) {
      const batch = PRIORITY_SUBS.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (sub) => {
          try {
            const fetchSorted = async (sort: "hot" | "rising" | "top", limit: number) => {
              const json = await fetchSubredditPosts(sub, { sort, limit, t: "day" });
              if (json.length > 0) return json;
              return fetchSubredditRSS(sub, sort === "top" ? "hot" : sort, limit);
            };

            const [hotSub, risingSub, topSub] = await Promise.all([
              fetchSorted("hot",    25),
              fetchSorted("rising", 15),
              fetchSorted("top",    15),
            ]);

            const subRaw = dedup([...hotSub, ...risingSub, ...topSub]);

            if (subRaw.length > 0) {
              const ranked = rankPosts(subRaw);
              await cache.set(SUB_KEY(sub), ranked, CACHE_TTL_MS); // ← SDK
              results[sub]  = ranked.length;
              totalPosts   += ranked.length;
            }
          } catch (err) {
            console.warn(`[cron] r/${sub} failed:`, err);
          }
        })
      );

      if (i + BATCH_SIZE < PRIORITY_SUBS.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const elapsed = Date.now() - startedAt;
    console.log(`[cron] Done in ${elapsed}ms — ${totalPosts} posts across ${Object.keys(results).length} feeds`);

    return NextResponse.json({
      ok:           true,
      elapsed_ms:   elapsed,
      total_posts:  totalPosts,
      feeds:        results,
      refreshed_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error("[cron] Refresh failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
