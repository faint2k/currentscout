/**
 * POST /api/cron/ingest
 *
 * Called by GitHub Actions after it fetches Reddit directly.
 * Receives raw RedditPost[] from Azure IPs (not blocked by Reddit),
 * ranks them, and writes to Upstash Redis.
 *
 * This decouples the Reddit fetch (GitHub Actions) from the
 * ranking + caching (Vercel), fixing the Vercel IP block issue.
 */

import { NextRequest, NextResponse } from "next/server";
import { rankPosts } from "../../../../lib/ranking/scorer";
import { cache } from "../../../../lib/cache/store";
import { SUBREDDIT_NAMES } from "../../../../lib/utils/subreddits";
import type { RedditPost } from "../../../../lib/reddit/types";

const CACHE_TTL_MS = 20 * 60 * 1000;
const OVERVIEW_KEY = `overview:${[...SUBREDDIT_NAMES].sort().join(",")}`;
const SUB_KEY      = (name: string) => `sub:${name.toLowerCase()}`;

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: { posts?: RedditPost[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const posts = body.posts;
  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: "posts array required" }, { status: 400 });
  }

  const startedAt = Date.now();

  // ── Deduplicate ─────────────────────────────────────────────────────────────
  const seen = new Set<string>();
  const deduped = posts.filter((p) => {
    if (!p?.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // ── Rank and write overview ──────────────────────────────────────────────────
  const ranked = rankPosts(deduped);
  await cache.set(OVERVIEW_KEY, ranked, CACHE_TTL_MS);

  // ── Rank and write per-subreddit ─────────────────────────────────────────────
  const bySub = new Map<string, RedditPost[]>();
  for (const post of deduped) {
    const key = post.subreddit.toLowerCase();
    if (!bySub.has(key)) bySub.set(key, []);
    bySub.get(key)!.push(post);
  }

  await Promise.all(
    [...bySub.entries()].map(async ([sub, subPosts]) => {
      const rankedSub = rankPosts(subPosts);
      await cache.set(SUB_KEY(sub), rankedSub, CACHE_TTL_MS);
    })
  );

  const elapsed = Date.now() - startedAt;
  console.log(`[ingest] ${ranked.length} posts ranked across ${bySub.size} subreddits in ${elapsed}ms`);

  return NextResponse.json({
    ok:           true,
    elapsed_ms:   elapsed,
    total_posts:  ranked.length,
    subreddits:   bySub.size,
    ingested_at:  new Date().toISOString(),
  });
}
