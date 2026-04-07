/**
 * store.ts — Two-tier cache: Upstash Redis (global) with in-memory fallback
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (production),
 * all Vercel function instances share the same Redis cache — Reddit is only
 * fetched once per TTL window regardless of how many concurrent users exist.
 *
 * Without those env vars (local dev), falls back to in-memory cache so
 * development works with zero setup.
 */

interface CacheEntry<T> {
  value:     T;
  timestamp: number;
  expiresAt: number;
}

// ─── In-memory fallback (local dev / single-instance) ─────────────────────────

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return null; }
    return entry;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, timestamp: Date.now(), expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void { this.store.delete(key); }
}

const memCache = new InMemoryCache();

// ─── Upstash Redis (production — shared across all Vercel instances) ──────────

async function redisGet<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json() as { result: string | null };
    if (!data.result) return null;

    const entry = JSON.parse(data.result) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) return null;
    return entry;
  } catch {
    return null;
  }
}

async function redisSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  try {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return;

    const entry: CacheEntry<T> = { value, timestamp: Date.now(), expiresAt: Date.now() + ttlMs };
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    await fetch(`${url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: JSON.stringify(entry), ex: ttlSeconds }),
      cache: "no-store",
    });
  } catch {
    // Redis write failure is non-fatal — fall through to live fetch
  }
}

// ─── Unified cache interface ──────────────────────────────────────────────────

export const cache = {
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // Try Redis first (production), fall back to in-memory (dev)
    const redisHit = await redisGet<T>(key);
    if (redisHit) return redisHit;
    return memCache.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    // Write to both so in-memory acts as L1 on warm instances
    memCache.set(key, value, ttlMs);
    await redisSet(key, value, ttlMs);
  },

  invalidate(key: string): void {
    memCache.invalidate(key);
    // Redis TTL handles expiry automatically — no explicit delete needed
  },
};
