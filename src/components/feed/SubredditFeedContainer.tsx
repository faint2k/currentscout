"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PostList } from "./PostList";
import { FilterBar } from "../filters/FilterBar";
import { SubredditChip } from "../ui/SubredditChip";
import { getSubredditConfig } from "../../lib/utils/subreddits";
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
      <div className="mb-4 flex items-center gap-3">
        <SubredditChip name={subreddit} clickable={false} className="text-sm px-2 py-1" />
        {config && (
          <span className="text-xs text-zinc-500">{config.description}</span>
        )}
        {config && (
          <span className="ml-auto text-[10px] text-zinc-600">
            {config.weight.toFixed(2)}× weight · Tier {config.tier}
          </span>
        )}
      </div>
      <FilterBar totalPosts={posts.length} fetchedAt={fetchedAt} cached={cached} />
      <PostList posts={posts} showRank />
    </div>
  );
}
