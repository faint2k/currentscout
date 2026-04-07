import type { SignalBadge } from "../ranking/scorer";

// ─── Raw Reddit API types ─────────────────────────────────────────────────────

export interface RedditListingChild<T> {
  kind: string;
  data: T;
}

export interface RedditListing<T> {
  kind: "Listing";
  data: {
    after:    string | null;
    before:   string | null;
    children: RedditListingChild<T>[];
    dist:     number;
  };
}

/** Minimal subset of Reddit post data we care about */
export interface RedditPost {
  id:               string;
  name:             string;          // fullname e.g. t3_abc123
  title:            string;
  selftext:         string;
  url:              string;
  permalink:        string;
  author:           string;
  subreddit:        string;
  subreddit_id:     string;
  score:            number;
  upvote_ratio:     number;
  num_comments:     number;
  created_utc:      number;          // unix timestamp
  thumbnail:        string | null;
  preview?:         { images: Array<{ source: { url: string; width: number; height: number } }> };
  is_self:          boolean;
  is_video:         boolean;
  domain:           string;
  link_flair_text:  string | null;
  link_flair_css_class: string | null;
  stickied:         boolean;
  over_18:          boolean;
  spoiler:          boolean;
  locked:           boolean;
  post_hint?:       string;
}

// ─── Ranked post (after scorer enrichment) ───────────────────────────────────

export interface PostScores {
  momentum:   number; // 0–100
  recency:    number; // 0–100
  engagement: number; // 0–100
  quality:    number; // 0–100
  final:      number; // 0–100 (weighted composite)
}

export interface RankedPost extends RedditPost {
  hoursOld:        number;
  scores:          PostScores;
  subredditWeight: number;
  badges:          SignalBadge[];
}

// ─── Feed / filter types ──────────────────────────────────────────────────────

export type SortMode =
  | "weighted"   // default: final weighted score
  | "trending"   // momentum-first
  | "hot"        // engagement-first
  | "new"        // recency-first
  | "top";       // raw score

export type TimeFilter = "1h" | "4h" | "12h" | "24h" | "3d" | "7d" | "all";

export interface FeedFilters {
  sort:       SortMode;
  time:       TimeFilter;
  subreddits: string[];   // empty = all
  categories: string[];   // empty = all
  minScore:   number;     // raw reddit score threshold
  search:     string;
}

// ─── API response types ───────────────────────────────────────────────────────

export interface PostsApiResponse {
  posts:     RankedPost[];
  fetchedAt: number;       // unix ms
  sources:   string[];     // which subreddits were fetched
  cached:    boolean;
}

export interface SubredditApiResponse {
  posts:          RankedPost[];
  subreddit:      string;
  fetchedAt:      number;
  cached:         boolean;
}
