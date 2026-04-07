/**
 * store.ts — Two-tier cache: Upstash Redis (global) with in-memory fallback
 *
 * Uses the @upstash/redis SDK which handles serialisation and the REST API
 * format correctly — no raw fetch calls needed.
 *
 * Without UPSTASH_* env vars (local dev) falls back to in-memory cache.
 */

import { Redis } from "@upstash/redis";

interface CacheEntry<T> {
  value:     T;
  timestamp: number;
  expiresAt: number;
}

// ─── Upstash client (lazy singleton) ─────────────────────────────────────────

function getRedis(): Redis | null {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ─── In-memory fallback (local dev) ──────────────────────────────────────────

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

// ─── Unified cache interface ──────────────────────────────────────────────────

export const cache = {
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    // 1. Try Redis (production)
    try {
      const redis = getRedis();
      if (redis) {
        const entry = await redis.get<CacheEntry<T>>(key);
        if (entry) {
          if (Date.now() > entry.expiresAt) return null;
          return entry;
        }
      }
    } catch (err) {
      console.warn("[cache] Redis get error:", err);
    }

    // 2. In-memory fallback (dev / Redis unavailable)
    return memCache.get<T>(key);
  },

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    // Write to in-memory first (always, acts as L1 on warm instances)
    memCache.set(key, value, ttlMs);

    // Write to Redis (production)
    try {
      const redis = getRedis();
      if (redis) {
        await redis.set(key, entry, { ex: ttlSeconds });
      }
    } catch (err) {
      console.warn("[cache] Redis set error:", err);
      // Non-fatal — in-memory cache still works for this instance
    }
  },

  invalidate(key: string): void {
    memCache.invalidate(key);
    // Redis TTL handles expiry — no explicit delete needed
  },
};
