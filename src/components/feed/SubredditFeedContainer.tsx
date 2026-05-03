"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PostList } from "./PostList";
import { FilterBar } from "../filters/FilterBar";
import { SubredditChip } from "../ui/SubredditChip";
import { getSubredditConfig } from "../../lib/utils/subreddits";
import {
  getReturnCtaLabel,
  getReturnDestinationLabel,
  sanitizeInternalReturnPath,
} from "../../lib/utils/returnNavigation";
import type { RankedPost } from "../../lib/reddit/types";

interface SubredditFeedContainerProps {
  subreddit: string;
}

export function SubredditFeedContainer({ subreddit }: SubredditFeedContainerProps) {
  const [posts,     setPosts]     = useState<RankedPost[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | undefined>();
  const [cached,    setCached]    = useState(false);

  const config = getSubredditConfig(subreddit);
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const returnHref = sanitizeInternalReturnPath(new URLSearchParams(currentSearch).get("from")) ?? "/";
  const returnLabel = getReturnCtaLabel(returnHref);
  const returnDestination = getReturnDestinationLabel(returnHref);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subreddit/${encodeURIComponent(subreddit)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setFetchedAt(data.fetchedAt);
      setCached(data.cached);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [subreddit]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  if (loading) {
    return (
      <div>
        <div className="mb-4 pb-3 border-b border-zinc-800/60">
          <div className="h-4 bg-zinc-800 rounded w-40 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
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
        <p className="text-sm text-zinc-400">{error}</p>
        <button onClick={fetchPosts} className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Link
            href={returnHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition-colors hover:border-violet-400/40 hover:bg-violet-500/14"
          >
            <span aria-hidden="true">←</span>
            <span>{returnLabel}</span>
          </Link>

          <SubredditChip name={subreddit} clickable={false} className="text-sm px-2 py-1" />

          {config && (
            <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-2.5 py-1 text-[10px] text-zinc-400">
              {config.weight.toFixed(2)}× weight · Tier {config.tier}
            </span>
          )}
        </div>

        {config && (
          <span className="text-xs text-zinc-500">{config.description}</span>
        )}

        <p className="mt-2 text-[11px] text-zinc-500">
          You’re viewing one community. Jump back to {returnDestination === "CurrentScout" ? "the full feed" : returnDestination.toLowerCase()} anytime.
        </p>
      </div>
      <FilterBar totalPosts={posts.length} fetchedAt={fetchedAt} cached={cached} />
      <PostList posts={posts} showRank />
    </div>
  );
}
