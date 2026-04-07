/**
 * rss.ts — Reddit RSS feed fallback
 *
 * Reddit exposes public Atom feeds at:
 *   https://www.reddit.com/r/{sub}/.rss?limit=25
 *
 * These work from Vercel/cloud IPs without any authentication and are far
 * less restricted than the JSON API.
 *
 * Trade-off: RSS doesn't include upvote counts or upvote ratio.
 * We approximate score using feed position (slot 1 = highest ranked) so the
 * ranking engine still produces meaningful results.
 * Comments count IS parseable from the content HTML.
 */

import type { RedditPost } from "./types";

const RSS_BASE    = "https://www.reddit.com/r";
const USER_AGENT  = "web:aihub:v1.0 (by /u/aihub_bot)";

// ─── XML helpers ─────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeXmlEntities(m[1].trim()) : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m ? m[1] : "";
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&#32;/g,  " ")
    .replace(/<[^>]+>/g, ""); // strip any remaining HTML tags from title
}

/** Parse comment count from Reddit's content HTML, e.g. "[42 comments]" */
function parseCommentCount(contentHtml: string): number {
  const m = contentHtml.match(/\[(\d+)\s+comments?\]/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Extract the external URL from a link post's content HTML */
function parseExternalUrl(contentHtml: string, permalink: string): string {
  // Link posts include an <a href="..."> to the external URL in their content
  const links = [...contentHtml.matchAll(/href="(https?:\/\/(?!www\.reddit\.com)[^"]+)"/gi)];
  return links[0]?.[1] ?? `https://www.reddit.com${permalink}`;
}

/** Estimate score from feed position (Reddit's hot feed orders by score+age) */
function estimatedScore(position: number): number {
  // Exponential decay: position 0 ≈ 800, position 24 ≈ 20
  return Math.max(10, Math.round(800 * Math.exp(-position * 0.14)));
}

// ─── Entry parser ─────────────────────────────────────────────────────────────

function parseEntry(entryXml: string, subreddit: string, position: number): RedditPost | null {
  try {
    // Title
    const rawTitle = extractTag(entryXml, "title");
    if (!rawTitle) return null;

    // Link — Reddit uses <link rel="alternate" href="..."/>
    const permalink = extractAttr(entryXml, "link", "href")
      .replace("https://www.reddit.com", "") || `/r/${subreddit}/`;

    // Author
    const author = extractTag(entryXml, "name") || "[deleted]";

    // Published date → unix timestamp
    const published = extractTag(entryXml, "published");
    const createdUtc = published
      ? Math.floor(new Date(published).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    // Post ID from <id>tag: e.g. https://www.reddit.com/t3_abc123
    const idTag = extractTag(entryXml, "id");
    const postId = idTag.split("/t3_")[1]?.replace(/\/$/, "") ||
                   `rss_${subreddit}_${position}`;

    // Content HTML — contains external link + comment count
    const contentRaw = entryXml.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1] ?? "";
    const numComments = parseCommentCount(contentRaw);

    // Determine if self post
    const isSelf = contentRaw.includes("[link]") === false ||
                   permalink.includes(postId);

    // URL
    const url = isSelf
      ? `https://www.reddit.com${permalink}`
      : parseExternalUrl(contentRaw, permalink);

    // Domain
    let domain = `self.${subreddit}`;
    if (!isSelf) {
      try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { /* keep default */ }
    }

    // Flair from <category> tag
    const flair = extractAttr(entryXml, "category", "label") || null;

    return {
      id:                   postId,
      name:                 `t3_${postId}`,
      title:                rawTitle,
      selftext:             "",
      url,
      permalink,
      author,
      subreddit,
      subreddit_id:         "",
      score:                estimatedScore(position),
      upvote_ratio:         0.90,       // RSS doesn't expose this — use safe default
      num_comments:         numComments,
      created_utc:          createdUtc,
      thumbnail:            null,
      is_self:              isSelf,
      is_video:             false,
      domain,
      link_flair_text:      flair,
      link_flair_css_class: null,
      stickied:             false,
      over_18:              false,
      spoiler:              false,
      locked:               false,
    };
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchSubredditRSS(
  subreddit: string,
  sort: "hot" | "new" | "rising" | "top" = "hot",
  limit = 25
): Promise<RedditPost[]> {
  const url = `${RSS_BASE}/${subreddit}/${sort}/.rss?limit=${limit}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:       "application/rss+xml, application/atom+xml, text/xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[rss] r/${subreddit} ${sort} → HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();

    // Split on <entry> tags (Reddit uses Atom format)
    const entries = xml.split(/<entry>/i).slice(1);

    const posts: RedditPost[] = [];
    for (let i = 0; i < entries.length; i++) {
      const post = parseEntry(entries[i], subreddit, i);
      if (post) posts.push(post);
    }

    return posts;
  } catch (err) {
    console.warn(`[rss] fetch failed for r/${subreddit}:`, err);
    return [];
  }
}

export async function fetchMultipleSubredditsRSS(
  subreddits: string[],
  sort: "hot" | "new" | "rising" | "top" = "hot",
  limit = 25
): Promise<RedditPost[]> {
  const BATCH_SIZE = 5;
  const all: RedditPost[] = [];

  for (let i = 0; i < subreddits.length; i += BATCH_SIZE) {
    const batch = subreddits.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((sub) => fetchSubredditRSS(sub, sort, limit))
    );

    for (const result of results) {
      if (result.status === "fulfilled") all.push(...result.value);
    }

    if (i + BATCH_SIZE < subreddits.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
