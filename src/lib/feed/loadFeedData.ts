import { fetchOverviewFeed, fetchSubredditFeed } from "../reddit/fetcher";
import { filterTrending, filterHighSignal } from "../ranking/scorer";
import { SUBREDDIT_NAMES } from "../utils/subreddits";
import type { RankedPost, SortMode, TimeFilter } from "../reddit/types";

interface LoadFeedOptions {
  subreddits?: string[];
  sort?: SortMode;
  time?: TimeFilter;
  limit?: number;
  mode?: "overview" | "trending" | "high-signal";
}

function applyTimeFilter(posts: RankedPost[], time: TimeFilter): RankedPost[] {
  if (time === "all") return posts;

  const limits: Record<TimeFilter, number> = {
    "1h": 1,
    "4h": 4,
    "12h": 12,
    "24h": 24,
    "3d": 72,
    "7d": 168,
    all: Infinity,
  };

  const maxHours = limits[time];
  return posts.filter((post) => post.hoursOld <= maxHours);
}

function applySort(posts: RankedPost[], sort: SortMode): RankedPost[] {
  return [...posts].sort((a, b) => {
    switch (sort) {
      case "trending":
        return b.scores.momentum - a.scores.momentum;
      case "hot":
        return b.scores.engagement - a.scores.engagement;
      case "new":
        return b.created_utc - a.created_utc;
      case "top":
        return b.score - a.score;
      case "weighted":
      default:
        return b.scores.final - a.scores.final;
    }
  });
}

export async function loadFeedData({
  subreddits = SUBREDDIT_NAMES,
  sort = "weighted",
  time = "24h",
  limit = 100,
  mode = "overview",
}: LoadFeedOptions = {}) {
  const { posts, cached, fetchedAt, sources } = await fetchOverviewFeed(subreddits);

  let filtered = applyTimeFilter(posts, time);

  if (mode === "trending") filtered = filterTrending(filtered);
  if (mode === "high-signal") filtered = filterHighSignal(filtered);

  const sorted = applySort(filtered, sort);

  return {
    posts: sorted.slice(0, limit),
    total: filtered.length,
    fetchedAt,
    cached,
    sources,
  };
}

export async function loadSubredditFeedData(subreddit: string) {
  return fetchSubredditFeed(subreddit);
}
