/**
 * membershipFetcher.ts
 *
 * Fetches subreddit subscriber counts from Reddit's public about.json endpoint.
 * Same access class as public JSON feed — works locally, may be blocked on Vercel.
 * Designed to fail gracefully: if blocked or errored, static fallbacks remain.
 */

const UA = "web:currentscout:v1.0 (by /u/Expensive-Spot6032)";

export interface SubredditAbout {
  name:        string;
  subscribers: number;
  source:      "live" | "failed";
}

/**
 * Fetch one subreddit's about data.
 * Returns { name, subscribers: 0, source: "failed" } on any error.
 */
export async function fetchSubredditAbout(name: string): Promise<SubredditAbout> {
  try {
    const url = `https://www.reddit.com/r/${name}/about.json`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:       "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[membershipFetcher] r/${name} about.json → HTTP ${res.status}`);
      return { name, subscribers: 0, source: "failed" };
    }

    const json = (await res.json()) as { data?: { subscribers?: number } };
    const subscribers = json?.data?.subscribers ?? 0;

    return { name, subscribers, source: "live" };
  } catch (err) {
    console.warn(`[membershipFetcher] r/${name} fetch failed:`, err);
    return { name, subscribers: 0, source: "failed" };
  }
}

/**
 * Batch fetch for a list of subreddits, in batches of 5 with 300ms pause.
 * Returns only successful fetches — failed ones are silently skipped.
 */
export async function fetchMemberCounts(
  names: string[],
  options?: { batchSize?: number; pauseMs?: number }
): Promise<SubredditAbout[]> {
  const batchSize = options?.batchSize ?? 5;
  const pauseMs   = options?.pauseMs   ?? 300;

  const results: SubredditAbout[] = [];

  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);

    const settled = await Promise.allSettled(
      batch.map((name) => fetchSubredditAbout(name))
    );

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.source === "live") {
        results.push(result.value);
      }
    }

    if (i + batchSize < names.length) {
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }

  return results;
}
