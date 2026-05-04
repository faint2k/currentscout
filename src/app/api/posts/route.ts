/**
 * GET /api/posts
 *
 * Query params:
 *   subreddits  comma-separated list (optional, defaults to all)
 *   sort        weighted | trending | hot | new | top (default: weighted)
 *   time        1h | 4h | 12h | 24h | 3d | 7d | all (default: 24h)
 *   limit       number of posts (default: 50, max: 200)
 *   mode        overview | trending | high-signal (default: overview)
 */

import { NextRequest, NextResponse } from "next/server";
import { loadFeedData } from "../../../lib/feed/loadFeedData";
import { SUBREDDIT_NAMES } from "../../../lib/utils/subreddits";
import type { SortMode, TimeFilter } from "../../../lib/reddit/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const subredditsParam = searchParams.get("subreddits");
  const subreddits = subredditsParam
    ? subredditsParam.split(",").map((s) => s.trim()).filter(Boolean)
    : SUBREDDIT_NAMES;

  const sort  = (searchParams.get("sort")  ?? "weighted") as SortMode;
  const time  = (searchParams.get("time")  ?? "24h")      as TimeFilter;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const mode  = searchParams.get("mode") ?? "overview";

  try {
    const { posts, total, cached, fetchedAt, sources } = await loadFeedData({
      subreddits,
      sort,
      time,
      limit,
      mode: mode as "overview" | "trending" | "high-signal",
    });

    const response = NextResponse.json({
      posts,
      total,
      fetchedAt,
      cached,
      sources,
    });

    // Tell Vercel's CDN edge to cache this response for 5 minutes,
    // serve stale for up to 15 minutes while revalidating in background.
    // This means thousands of concurrent users all get the same cached
    // response with zero extra Reddit API calls.
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=900"
    );

    return response;
  } catch (err) {
    console.error("[api/posts] Error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
