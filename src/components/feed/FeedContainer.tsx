"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PostList } from "./PostList";
import { FilterBar } from "../filters/FilterBar";
import type { RankedPost } from "../../lib/reddit/types";

interface FeedContainerProps {
  mode?:       "overview" | "trending" | "high-signal";
  subreddits?: string[];
  label?:      string;
  /** If provided, skip the API call and use these posts directly */
  initialPosts?: RankedPost[];
  initialFetchedAt?: number;
  initialCached?: boolean;
  showRank?: boolean;
}

export function FeedContainer({
  mode = "overview",
  subreddits,
  label,
  initialPosts,
  initialFetchedAt,
  initialCached,
  showRank = false,
}: FeedContainerProps) {
  const [posts,     setPosts]     = useState<RankedPost[]>(initialPosts ?? []);
  const [loading,   setLoading]   = useState(!initialPosts);
  const [error,     setError]     = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | undefined>(initialFetchedAt);
  const [cached,    setCached]    = useState<boolean>(initialCached ?? false);

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

  if (loading) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 mr-auto">
            {label && <h1 className="text-sm font-semibold text-zinc-200">{label}</h1>}
            <span className="text-xs text-zinc-600 animate-pulse">Loading…</span>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800/70 rounded-lg px-4 py-3 animate-pulse">
              <div className="h-3 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-2 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <span className="text-3xl mb-3">⚠</span>
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          onClick={fetchPosts}
          className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <FilterBar
        totalPosts={posts.length}
        fetchedAt={fetchedAt}
        cached={cached}
        label={label}
      />
      <PostList posts={posts} showRank={showRank} />
    </div>
  );
}
