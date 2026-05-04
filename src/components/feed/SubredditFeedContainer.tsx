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
  initialPosts?: RankedPost[];
  initialFetchedAt?: number;
  initialCached?: boolean;
}

const CLIENT_FETCH_TIMEOUT_MS = 12000;

export function SubredditFeedContainer({
  subreddit,
  initialPosts,
  initialFetchedAt,
  initialCached,
}: SubredditFeedContainerProps) {
  const [posts, setPosts] = useState<RankedPost[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(initialPosts === undefined);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | undefined>(initialFetchedAt);
  const [cached, setCached] = useState(initialCached ?? false);

  const config = getSubredditConfig(subreddit);
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const returnHref = sanitizeInternalReturnPath(new URLSearchParams(currentSearch).get("from")) ?? "/";
  const returnLabel = getReturnCtaLabel(returnHref);
  const returnDestination = getReturnDestinationLabel(returnHref);

  const hasPosts = posts.length > 0;
  const showBlockingLoading = loading && !hasPosts;
  const showRefreshError = !loading && !!error && hasPosts;

  const fetchPosts = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CLIENT_FETCH_TIMEOUT_MS);

    if (!hasPosts) setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/subreddit/${encodeURIComponent(subreddit)}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setFetchedAt(data.fetchedAt);
      setCached(data.cached);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Community refresh timed out. Showing the last available posts.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [hasPosts, subreddit]);

  useEffect(() => {
    if (initialPosts === undefined) {
      void fetchPosts();
    }
  }, [fetchPosts, initialPosts]);

  if (showBlockingLoading) {
    return (
      <div>
        <div className="mb-4 border-b border-zinc-800/60 pb-3">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-zinc-800/70 bg-zinc-900 px-4 py-3">
              <div className="mb-2 h-3 w-3/4 rounded bg-zinc-800" />
              <div className="h-2 w-1/2 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
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

      {showRefreshError && (
        <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <button
              onClick={fetchPosts}
              className="self-start rounded-lg border border-amber-400/25 px-3 py-1 text-xs font-medium text-amber-100 transition-colors hover:border-amber-300/40 hover:bg-amber-400/10"
            >
              Retry refresh
            </button>
          </div>
        </div>
      )}

      {error && !loading && !hasPosts ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <p className="text-sm text-zinc-400">{error}</p>
          <button onClick={fetchPosts} className="mt-3 text-xs text-violet-400 underline hover:text-violet-300">
            Try again
          </button>
        </div>
      ) : !hasPosts ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <p className="text-sm text-zinc-400">No posts are available for this community right now.</p>
          <button onClick={fetchPosts} className="mt-3 text-xs text-violet-400 underline hover:text-violet-300">
            Refresh community
          </button>
        </div>
      ) : (
        <>
          <FilterBar totalPosts={posts.length} fetchedAt={fetchedAt} cached={cached} />
          <PostList posts={posts} showRank />
        </>
      )}
    </div>
  );
}
