/**
 * Reddit top-comment fetcher — no OAuth required.
 *
 * Uses the same public JSON endpoint as the RSS feed, just for comments.
 * Called at cron time for the top N RSS posts. Results are stored in Redis
 * alongside the post so no per-request fetching is needed.
 */

import type { RankedPost } from "./types";

const UA = "web:currentscout:v1.0 (by /u/Expensive-Spot6032)";

/** Strip basic Reddit markdown, collapse whitespace, truncate */
function cleanComment(text: string, maxLen = 240): string {
  const cleaned = text
    .replace(/^&gt;.*$/gm, "")          // blockquotes (remove entire line)
    .replace(/\*\*(.+?)\*\*/g, "$1")    // **bold**
    .replace(/\*(.+?)\*/g, "$1")        // *italic*
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url)
    .replace(/https?:\/\/\S+/g, "")     // bare URLs
    .replace(/\n+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  // Break at last word boundary before maxLen
  const cut = cleaned.lastIndexOf(" ", maxLen);
  return cleaned.slice(0, cut > 80 ? cut : maxLen) + "…";
}

/** Fetch the top-scored comment for a single Reddit post */
export async function fetchTopComment(permalink: string): Promise<string | undefined> {
  // HN posts have full URLs as permalinks — skip them
  if (permalink.startsWith("http")) return undefined;

  try {
    const clean = permalink.replace(/\/$/, "");
    const url   = `https://www.reddit.com${clean}.json?sort=top&limit=3&depth=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal:  AbortSignal.timeout(6_000),
    });
    if (!res.ok) return undefined;

    const data = await res.json();
    // data[0] = post listing, data[1] = comments listing
    const children: unknown[] = data?.[1]?.data?.children ?? [];

    for (const child of children as Array<{ kind: string; data: { body?: string; score?: number } }>) {
      if (child.kind !== "t1") continue;
      const body = child.data?.body ?? "";
      if (!body || body === "[deleted]" || body === "[removed]") continue;
      const result = cleanComment(body);
      if (result.length < 20) continue;  // too short to be useful
      return result;
    }
  } catch {
    // Comment preview is bonus — never let this break the cron
  }
  return undefined;
}

/**
 * Mutates the top `limit` RSS posts in-place, adding `topComment`.
 * Runs in batches to avoid hammering Reddit.
 */
export async function enrichWithTopComments(
  posts: RankedPost[],
  limit = 20
): Promise<void> {
  const targets = posts
    .filter((p) => p.dataSource === "rss" && !p.permalink.startsWith("http"))
    .slice(0, limit);

  if (targets.length === 0) return;
  console.log(`[comments] Fetching top comments for ${targets.length} posts…`);

  const BATCH = 4;  // 4 concurrent, then pause — gentle on Reddit
  let fetched = 0;

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (post) => {
        post.topComment = await fetchTopComment(post.permalink);
        if (post.topComment) fetched++;
      })
    );
    if (i + BATCH < targets.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log(`[comments] Enriched ${fetched}/${targets.length} posts with top comments`);
}
