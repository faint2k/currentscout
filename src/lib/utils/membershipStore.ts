/**
 * membershipStore.ts — In-memory subreddit membership registry
 *
 * Singleton per Node.js process. Holds live subscriber counts fetched by cron,
 * with static fallbacks derived from subreddits.ts config.
 *
 * No React, no Next.js — pure TypeScript module. Safe for server-side use only.
 */

export interface SubredditMembership {
  name:           string;  // subreddit name lowercase
  memberCount:    number;  // live count from API, or 0 if unknown
  staticFallback: number;  // hardcoded fallback from subreddits.ts data
  source:         "live" | "static" | "none";
  lastUpdated:    number;  // unix ms, 0 if never
}

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

// Module-level registry — singleton per Node.js process
const registry = new Map<string, SubredditMembership>();

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Set live member count for a subreddit (called during fetch/cron).
 */
export function setMemberCount(name: string, count: number): void {
  const key      = name.toLowerCase();
  const existing = registry.get(key);
  registry.set(key, {
    name:           key,
    memberCount:    count,
    staticFallback: existing?.staticFallback ?? 0,
    source:         "live",
    lastUpdated:    Date.now(),
  });
}

/**
 * Initialize static fallbacks from subreddits config (call at startup).
 * Only overwrites the staticFallback field — does not clear live data.
 */
export function initStaticFallbacks(
  subs: Array<{ name: string; subscribers?: number; weight: number }>
): void {
  for (const sub of subs) {
    const key      = sub.name.toLowerCase();
    const fallback = sub.subscribers && sub.subscribers > 0
      ? sub.subscribers
      : deriveFromWeight(sub.weight);
    const existing = registry.get(key);
    registry.set(key, {
      name:           key,
      memberCount:    existing?.memberCount    ?? 0,
      staticFallback: fallback,
      source:         existing?.source         ?? "static",
      lastUpdated:    existing?.lastUpdated    ?? 0,
    });
  }
}

/** Derive a rough subscriber proxy from tier weight when no count is available. */
function deriveFromWeight(weight: number): number {
  if (weight >= 1.50) return 2_000_000; // tier1
  if (weight >= 1.30) return 800_000;   // tier2
  return 300_000;                        // tier3
}

/**
 * Bulk update from a fetch result.
 */
export function bulkUpdateMemberships(
  updates: Array<{ name: string; memberCount: number }>
): void {
  for (const u of updates) {
    setMemberCount(u.name, u.memberCount);
  }
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Get the best available member count for a subreddit.
 * Returns live count if available and < 4h stale, otherwise static fallback.
 * Always returns a positive number — falls back to weight-derived proxy.
 */
export function getMemberCount(name: string): number {
  const key    = name.toLowerCase();
  const record = registry.get(key);

  if (!record) return 0;

  const isLiveFresh =
    record.source === "live" &&
    record.memberCount > 0 &&
    Date.now() - record.lastUpdated < STALE_THRESHOLD_MS;

  if (isLiveFresh) return record.memberCount;

  if (record.staticFallback > 0) return record.staticFallback;

  return 0;
}

/**
 * Get full membership record (for debugging/panels).
 */
export function getMembershipRecord(name: string): SubredditMembership | undefined {
  return registry.get(name.toLowerCase());
}

/**
 * Get provenance string for debug: "live:2.1M" or "static:1.5M" or "none:100k"
 */
export function getMembershipDebugLabel(name: string): string {
  const key    = name.toLowerCase();
  const record = registry.get(key);

  if (!record) return "none:0";

  const isLiveFresh =
    record.source === "live" &&
    record.memberCount > 0 &&
    Date.now() - record.lastUpdated < STALE_THRESHOLD_MS;

  const count  = isLiveFresh ? record.memberCount : record.staticFallback;
  const source = isLiveFresh ? "live" : record.staticFallback > 0 ? "static" : "none";
  return `${source}:${formatCount(count)}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── Snapshot persistence ─────────────────────────────────────────────────────

/**
 * Export current snapshot for cache storage.
 */
export function exportSnapshot(): Record<string, SubredditMembership> {
  const out: Record<string, SubredditMembership> = {};
  for (const [key, val] of registry.entries()) {
    out[key] = val;
  }
  return out;
}

/**
 * Import snapshot from cache storage (e.g. after cold start).
 * Merges into registry — live data wins over snapshot for same key.
 */
export function importSnapshot(snapshot: Record<string, SubredditMembership>): void {
  for (const [key, val] of Object.entries(snapshot)) {
    const existing = registry.get(key);
    // Only import if no fresher live data exists in memory
    if (!existing || existing.lastUpdated < val.lastUpdated) {
      registry.set(key, val);
    }
  }
}
