/**
 * Reddit thread enrichment — no OAuth required.
 *
 * Uses Reddit's public thread JSON endpoint for a small, ranked subset of RSS
 * posts so we can recover the signals RSS strips out: real comment counts,
 * selftext, and a useful top-comment preview.
 *
 * This keeps the cheap/open RSS ingestion path, but upgrades the most visible
 * posts with richer discussion context before they are cached for the UI.
 */

import type { RankedPost } from "./types";

const UA = "web:currentscout:v1.0 (by /u/Expensive-Spot6032)";
const THREAD_TIMEOUT_MS = 6_000;

interface RedditCommentChild {
  kind: string;
  data?: {
    author?: string;
    body?: string;
    score?: number;
  };
}

interface ThreadSnapshot {
  numComments?: number;
  selftext?: string;
  topComment?: string;
}

/** Strip basic Reddit markdown, collapse whitespace, truncate. */
function cleanComment(text: string, maxLen = 240): string {
  const cleaned = text
    .replace(/^&gt;.*$/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLen) return cleaned;
  const cut = cleaned.lastIndexOf(" ", maxLen);
  return cleaned.slice(0, cut > 80 ? cut : maxLen) + "…";
}

function isLowValueComment(author: string, body: string): boolean {
  const lowerAuthor = author.toLowerCase();
  const lowerBody = body.toLowerCase();

  return (
    lowerAuthor === "automoderator" ||
    lowerAuthor.endsWith("bot") ||
    lowerBody.includes("featured it on our discord") ||
    lowerBody.includes("i am a bot")
  );
}

function pickTopComment(children: RedditCommentChild[]): string | undefined {
  const candidates = children
    .filter((child) => child.kind === "t1")
    .map((child) => ({
      author: child.data?.author ?? "",
      body: child.data?.body ?? "",
      score: child.data?.score ?? 0,
    }))
    .filter(({ body }) => body && body !== "[deleted]" && body !== "[removed]")
    .filter(({ author, body }) => !isLowValueComment(author, body))
    .sort((a, b) => b.score - a.score);

  for (const candidate of candidates) {
    const cleaned = cleanComment(candidate.body);
    if (cleaned.length >= 20) return cleaned;
  }

  return undefined;
}

/** Fetch thread metadata + best discussion preview for a single Reddit post. */
export async function fetchThreadSnapshot(permalink: string): Promise<ThreadSnapshot | undefined> {
  if (permalink.startsWith("http")) return undefined;

  try {
    const clean = permalink.replace(/\/$/, "");
    const url = `https://www.reddit.com${clean}.json?sort=top&limit=8&depth=1&raw_json=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(THREAD_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return undefined;

    const data = await res.json() as [
      { data?: { children?: Array<{ data?: { selftext?: string; num_comments?: number } }> } },
      { data?: { children?: RedditCommentChild[] } },
    ];

    const postData = data?.[0]?.data?.children?.[0]?.data;
    const commentChildren = data?.[1]?.data?.children ?? [];

    return {
      numComments: typeof postData?.num_comments === "number" ? postData.num_comments : undefined,
      selftext: postData?.selftext?.trim() || undefined,
      topComment: pickTopComment(commentChildren),
    };
  } catch {
    return undefined;
  }
}

/**
 * Mutates the top `limit` RSS posts in-place, adding real discussion context.
 * Returns the number of posts that received at least one enrichment field.
 */
export async function enrichWithThreadContext(
  posts: RankedPost[],
  limit = 20,
): Promise<number> {
  const targets = posts
    .filter((p) => p.dataSource === "rss" && !p.permalink.startsWith("http"))
    .slice(0, limit);

  if (targets.length === 0) return 0;
  console.log(`[comments] Fetching thread context for ${targets.length} RSS posts…`);

  const BATCH = 4;
  let enriched = 0;

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);

    await Promise.all(
      batch.map(async (post) => {
        const snapshot = await fetchThreadSnapshot(post.permalink);
        if (!snapshot) return;

        let touched = false;

        if (typeof snapshot.numComments === "number" && snapshot.numComments > post.num_comments) {
          post.num_comments = snapshot.numComments;
          touched = true;
        }

        if (snapshot.topComment && snapshot.topComment !== post.topComment) {
          post.topComment = snapshot.topComment;
          touched = true;
        }

        if (post.is_self && snapshot.selftext && snapshot.selftext.length > post.selftext.length) {
          post.selftext = snapshot.selftext;
          touched = true;
        }

        if (touched) enriched++;
      }),
    );

    if (i + BATCH < targets.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  console.log(`[comments] Enriched ${enriched}/${targets.length} RSS posts with live thread context`);
  return enriched;
}
