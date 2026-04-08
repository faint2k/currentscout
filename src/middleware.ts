/**
 * middleware.ts — Edge rate limiter
 *
 * Runs on Vercel's edge network (closest region to the user) before any
 * API route is hit. Uses a sliding-window counter stored in a module-level
 * Map — lightweight, zero extra services needed.
 *
 * Limits:
 *   /api/posts          → 60 req / minute per IP
 *   /api/subreddit/*    → 60 req / minute per IP
 *   /api/cron/refresh   → 10 req / minute per IP (extra tight — cron only)
 */

import { NextRequest, NextResponse } from "next/server";

interface WindowEntry {
  count:       number;
  windowStart: number; // ms
}

// Module-level store — persists across requests on the same edge instance
const store = new Map<string, WindowEntry>();

const LIMITS: { pattern: RegExp; maxPerMinute: number }[] = [
  { pattern: /^\/api\/cron/,       maxPerMinute: 10  },
  { pattern: /^\/api\/subreddit/,  maxPerMinute: 60  },
  { pattern: /^\/api\/posts/,      maxPerMinute: 60  },
];

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(key: string, maxPerMinute: number): {
  limited: boolean;
  remaining: number;
  resetIn: number; // seconds
} {
  const now        = Date.now();
  const windowMs   = 60_000;
  const entry      = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { limited: false, remaining: maxPerMinute - 1, resetIn: 60 };
  }

  entry.count++;
  const remaining = Math.max(0, maxPerMinute - entry.count);
  const resetIn   = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);

  if (entry.count > maxPerMinute) {
    return { limited: true, remaining: 0, resetIn };
  }

  return { limited: false, remaining, resetIn };
}

// Periodically clean up old entries to prevent memory growth
let lastCleanup = Date.now();
function maybeCleanup() {
  if (Date.now() - lastCleanup < 5 * 60_000) return; // every 5 min
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of store.entries()) {
    if (entry.windowStart < cutoff) store.delete(key);
  }
  lastCleanup = Date.now();
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  maybeCleanup();

  for (const { pattern, maxPerMinute } of LIMITS) {
    if (!pattern.test(pathname)) continue;

    const ip  = getIP(req);
    const key = `${ip}:${pathname.split("/").slice(0, 3).join("/")}`;
    const { limited, remaining, resetIn } = isRateLimited(key, maxPerMinute);

    if (limited) {
      return new NextResponse(
        JSON.stringify({
          error:   "Too many requests",
          message: `Rate limit: ${maxPerMinute} requests per minute. Try again in ${resetIn}s.`,
          resetIn,
        }),
        {
          status:  429,
          headers: {
            "Content-Type":      "application/json",
            "Retry-After":       String(resetIn),
            "X-RateLimit-Limit": String(maxPerMinute),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + resetIn),
          },
        }
      );
    }

    // Attach rate limit headers to all API responses (good practice)
    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit",     String(maxPerMinute));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    res.headers.set("X-RateLimit-Reset",     String(Math.ceil(Date.now() / 1000) + resetIn));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/posts/:path*", "/api/subreddit/:path*", "/api/cron/:path*"],
};
