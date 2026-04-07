/**
 * format.ts — Display formatting utilities
 */

/** Format a unix timestamp as relative "time ago" string */
export function timeAgo(createdUtc: number): string {
  const diff = Math.floor((Date.now() / 1000 - createdUtc));
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h}h ago`;
  }
  const d = Math.floor(diff / 86400);
  return `${d}d ago`;
}

/** Format a large number with k/M suffix */
export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.floor(n / 1000)}k`;
  if (n >= 1_000)     return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Format a score 0–100 as a percentage string */
export function formatScore(n: number): string {
  return `${Math.round(n)}`;
}

/** Truncate a string to a given length with ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/** Canonical Reddit URL from a permalink */
export function redditUrl(permalink: string): string {
  return `https://reddit.com${permalink}`;
}

/** Extract domain label for display */
export function displayDomain(url: string, isSelf: boolean, subreddit: string): string {
  if (isSelf) return `self.${subreddit}`;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Hours since unix timestamp */
export function hoursAgo(createdUtc: number): number {
  return (Date.now() / 1000 - createdUtc) / 3600;
}

/** Map a 0-100 score to a CSS color class (for score bars / indicators) */
export function scoreColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 55) return "text-yellow-400";
  if (score >= 35) return "text-orange-400";
  return "text-zinc-500";
}

/** Map a 0-100 score to a bar background class */
export function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 55) return "bg-yellow-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-zinc-600";
}
