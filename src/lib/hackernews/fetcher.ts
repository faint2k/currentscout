/**
 * hackernews/fetcher.ts
 *
 * Fetches AI-relevant stories from Hacker News via the Algolia Search API.
 * https://hn.algolia.com/api
 *
 * Why HN:
 *  - Fully open, commercial-use permitted, no API key required
 *  - REAL upvote counts and REAL comment counts (unlike RSS fallback)
 *  - High signal-to-noise — HN community aggressively downvotes fluff
 *  - Covers ~70% of the same AI stories that surface on Reddit
 *
 * Strategy: three keyword searches covering the AI landscape, last 48h,
 * minimum 5 points. Deduplicated by objectID before conversion.
 */

import type { RedditPost } from "../reddit/types";

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";
const WINDOW_HOURS = 48;
const MIN_POINTS   = 5;
const HITS_PER_PAGE = 50;

interface HNHit {
  objectID:     string;
  title:        string;
  url:          string | null;
  author:       string;
  points:       number;
  num_comments: number;
  created_at_i: number;
  story_text:   string | null;
}

interface AlgoliaResponse {
  hits: HNHit[];
}

// Three queries that together cover the AI space without too much overlap
const SEARCH_QUERIES = [
  "LLM GPT Claude Gemini Mistral Llama",
  "machine learning deep learning neural network transformer",
  "AI agent artificial intelligence model release",
];

async function searchHN(query: string, since: number): Promise<HNHit[]> {
  const params = new URLSearchParams({
    tags:              "story",
    query,
    numericFilters:    `created_at_i>${since},points>=${MIN_POINTS}`,
    hitsPerPage:       String(HITS_PER_PAGE),
    restrictSearchableAttributes: "title",
  });

  try {
    const res = await fetch(`${ALGOLIA_BASE}/search_by_date?${params}`, {
      headers: { "User-Agent": "web:currentscout:v1.0 (by /u/Expensive-Spot6032)" },
      cache:   "no-store",
    });

    if (!res.ok) {
      console.warn(`[hn] Algolia search failed: ${res.status}`);
      return [];
    }

    const data = await res.json() as AlgoliaResponse;
    return data.hits ?? [];
  } catch (err) {
    console.warn("[hn] Algolia fetch error:", err);
    return [];
  }
}

function hitToRedditPost(hit: HNHit): RedditPost {
  const isAsk  = !hit.url;
  const hnUrl  = `https://news.ycombinator.com/item?id=${hit.objectID}`;
  const url     = isAsk ? hnUrl : (hit.url ?? hnUrl);

  let domain = "news.ycombinator.com";
  if (!isAsk && hit.url) {
    try { domain = new URL(hit.url).hostname.replace(/^www\./, ""); } catch { /* keep default */ }
  }

  return {
    id:                   `hn_${hit.objectID}`,
    name:                 `hn_${hit.objectID}`,
    title:                hit.title,
    selftext:             "",
    url,
    permalink:            hnUrl,           // full URL — redditUrl() handles this
    author:               hit.author,
    subreddit:            "hackernews",
    subreddit_id:         "hackernews",
    score:                hit.points,      // REAL upvote count
    upvote_ratio:         0.95,            // HN has no downvotes; safe default
    num_comments:         hit.num_comments, // REAL comment count
    created_utc:          hit.created_at_i,
    thumbnail:            null,
    is_self:              isAsk,
    is_video:             false,
    domain,
    link_flair_text:      null,
    link_flair_css_class: null,
    stickied:             false,
    over_18:              false,
    spoiler:              false,
    locked:               false,
    source:               "hn",
  };
}

export async function fetchHNPosts(): Promise<RedditPost[]> {
  const since = Math.floor(Date.now() / 1000) - WINDOW_HOURS * 3600;

  const results = await Promise.allSettled(
    SEARCH_QUERIES.map((q) => searchHN(q, since))
  );

  // Merge and deduplicate by objectID
  const seen  = new Set<string>();
  const posts: RedditPost[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const hit of result.value) {
      if (seen.has(hit.objectID)) continue;
      if (!hit.title)             continue;
      seen.add(hit.objectID);
      posts.push(hitToRedditPost(hit));
    }
  }

  console.log(`[hn] Fetched ${posts.length} AI stories from HN (last ${WINDOW_HOURS}h, ≥${MIN_POINTS}pts)`);
  return posts;
}
