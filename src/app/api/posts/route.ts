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
import { fetchOverviewFeed } from "../../../lib/reddit/fetcher";
import { filterTrending, filterHighSignal } from "../../../lib/ranking/scorer";
import { SUBREDDIT_NAMES } from "../../../lib/utils/subreddits";
import type { RankedPost, SortMode, TimeFilter } from "../../../lib/reddit/types";

function applyTimeFilter(posts: RankedPost[], time: TimeFilter): RankedPost[] {
  if (time === "all") return posts;
  const limits: Record<TimeFilter, number> = {
    "1h": 1, "4h": 4, "12h": 12, "24h": 24, "3d": 72, "7d": 168, "all": Infinity,
  };
  const maxHours = limits[time];
  return posts.filter((p) => p.hoursOld <= maxHours);
}

function applySort(posts: RankedPost[], sort: SortMode): RankedPost[] {
  return [...posts].sort((a, b) => {
    switch (sort) {
      case "trending":   return b.scores.momentum   - a.scores.momentum;
      case "hot":        return b.scores.engagement - a.scores.engagement;
      case "new":        return b.created_utc        - a.created_utc;
      case "top":        return b.score             - a.score;
      case "weighted":
      default:           return b.scores.final      - a.scores.final;
    }
  });
}

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
    const { posts, cached, fetchedAt, sources } = await fetchOverviewFeed(subreddits);

    let filtered = applyTimeFilter(posts, time);

    if (mode === "trending")    filtered = filterTrending(filtered);
    if (mode === "high-signal") filtered = filterHighSignal(filtered);

    const sorted  = applySort(filtered, sort);
    const sliced  = sorted.slice(0, limit);

    return NextResponse.json({
      posts:     sliced,
      total:     filtered.length,
      fetchedAt,
      cached,
      sources,
    });
  } catch (err) {
    console.error("[api/posts] Error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
