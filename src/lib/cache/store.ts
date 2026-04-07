/**
 * store.ts — Simple in-memory cache for server-side Reddit API responses
 *
 * Prevents hammering the free Reddit API on every request.
 * Default TTL: 15 minutes (configurable per entry).
 *
 * In a production deployment you'd swap this for Redis or Upstash (both
 * have generous free tiers), but the in-process store works perfectly for
 * a single-server Next.js deployment.
 */

interface CacheEntry<T> {
  value:     T;
  timestamp: number; // Date.now() at write
  expiresAt: number; // Date.now() + ttl
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.store.keys()) {
      if (pattern.test(key)) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }
}

// Singleton — one cache instance per Node.js process
export const cache = new InMemoryCache();
