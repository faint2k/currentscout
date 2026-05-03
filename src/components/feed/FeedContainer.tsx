"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PostList } from "./PostList";
import { FilterBar } from "../filters/FilterBar";
import { SITE_TAGLINE, SITE_KICKER } from "../../lib/config";
import type { RankedPost } from "../../lib/reddit/types";

interface FeedContainerProps {
  mode?: "overview" | "trending" | "high-signal";
  subreddits?: string[];
  label?: string;
  initialPosts?: RankedPost[];
  initialFetchedAt?: number;
  initialCached?: boolean;
  showRank?: boolean;
  showHero?: boolean;
}

export function FeedContainer({
  mode = "overview",
  subreddits,
  label,
  initialPosts,
  initialFetchedAt,
  initialCached,
  showRank = false,
  showHero = false,
}: FeedContainerProps) {
  const [posts, setPosts] = useState<RankedPost[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | undefined>(initialFetchedAt);
  const [cached, setCached] = useState<boolean>(initialCached ?? false);
  const [rssBannerOpen, setRssBannerOpen] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode, limit: "100" });
      if (subreddits?.length) params.set("subreddits", subreddits.join(","));

      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setPosts(data.posts ?? []);
      setFetchedAt(data.fetchedAt);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [mode, subreddits]);

  useEffect(() => {
    if (!initialPosts) fetchPosts();
  }, [fetchPosts, initialPosts]);

  const hasRssPosts = posts.some((p) => p.dataSource === "rss");

  return (
    <div>
      <HeaderIntro showHero={showHero} label={label} loading={loading} />

      {hasRssPosts && rssBannerOpen && (
        <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-zinc-200 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-amber-100">Estimated ranking mode</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-300">
                Ranking is currently estimated from feed position, freshness, title quality, and
                community weight while Reddit API access is pending.
              </p>
            </div>
            <button
              onClick={() => setRssBannerOpen(false)}
              className="shrink-0 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-900/70 hover:text-zinc-200"
              aria-label="Dismiss trust message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <FilterBar
          totalPosts={posts.length}
          fetchedAt={fetchedAt}
          cached={cached}
          label={showHero ? undefined : label}
        />
      )}

      {loading && <LoadingState label={label} />}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60 py-16 text-zinc-500">
          <span className="mb-3 text-3xl text-zinc-400">⚠</span>
          <p className="text-sm text-zinc-300">{error}</p>
          <button
            onClick={fetchPosts}
            className="mt-3 text-xs text-violet-300 underline underline-offset-4 transition-colors hover:text-violet-200"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && <PostList posts={posts} showRank={showRank} />}
    </div>
  );
}

function HeaderIntro({
  showHero,
  label,
  loading,
}: {
  showHero: boolean;
  label?: string;
  loading: boolean;
}) {
  if (!showHero) {
    return label ? <h1 className="mb-3 text-base font-semibold text-zinc-100">{label}</h1> : null;
  }

  return (
    <div className="mb-4 border-b border-zinc-800/70 pb-4 sm:mb-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        <span className="rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-zinc-400">
          AI signal monitor
        </span>
        {loading && <span className="text-zinc-600">Loading fresh posts…</span>}
      </div>
      <h1 className="mt-3 max-w-3xl text-xl font-bold leading-tight tracking-tight text-zinc-100 sm:text-2xl lg:text-[2rem]">
        {SITE_TAGLINE}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
        {SITE_KICKER}
      </p>
    </div>
  );
}

function LoadingState({ label }: { label?: string }) {
  return (
    <div>
      {label && <div className="mb-3 text-sm text-zinc-500 md:hidden">{label}</div>}
      <div className="space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 px-4 py-3 animate-pulse"
          >
            <div className="mb-2 h-3 w-3/4 rounded bg-zinc-800" />
            <div className="mb-3 h-2 w-1/2 rounded bg-zinc-800/90" />
            <div className="h-2 w-2/5 rounded bg-zinc-800/80" />
          </div>
        ))}
      </div>
    </div>
  );
}
