"use client";

import React, { useState, useMemo } from "react";
import { PostCard } from "./PostCard";
import { PostModal } from "./PostModal";
import type { RankedPost, SortMode } from "../../lib/reddit/types";
import { useFeedStore } from "../../stores/feedStore";

interface PostListProps {
  posts:        RankedPost[];
  showRank?:    boolean;
  compact?:     boolean;
  emptyMessage?: string;
}

function applySortClient(posts: RankedPost[], sort: SortMode): RankedPost[] {
  return [...posts].sort((a, b) => {
    switch (sort) {
      case "trending":   return b.scores.momentum   - a.scores.momentum;
      case "hot":        return b.scores.engagement - a.scores.engagement;
      case "new":        return b.created_utc        - a.created_utc;
      case "top":        return b.score             - a.score;
      default:           return b.scores.final      - a.scores.final;
    }
  });
}

export function PostList({
  posts,
  showRank = false,
  compact = false,
  emptyMessage = "No posts found.",
}: PostListProps) {
  const [selected, setSelected] = useState<RankedPost | null>(null);
  const { filters } = useFeedStore();

  const filtered = useMemo(() => {
    let result = posts;

    // Subreddit filter
    if (filters.subreddits.length > 0) {
      result = result.filter((p) =>
        filters.subreddits.some(
          (s) => s.toLowerCase() === p.subreddit.toLowerCase()
        )
      );
    }

    // Category filter
    // (categories handled by parent page)

    // Search
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subreddit.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }

    // Min score
    if (filters.minScore > 0) {
      result = result.filter((p) => p.score >= filters.minScore);
    }

    // Time filter
    const timeMap: Record<string, number> = {
      "1h": 1, "4h": 4, "12h": 12, "24h": 24, "3d": 72, "7d": 168,
    };
    if (filters.time !== "all" && timeMap[filters.time]) {
      result = result.filter((p) => p.hoursOld <= timeMap[filters.time]);
    }

    return applySortClient(result, filters.sort);
  }, [posts, filters]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
        <span className="text-3xl mb-3">∅</span>
        <p className="text-sm">{emptyMessage}</p>
        {filters.search && (
          <p className="text-xs mt-1 text-zinc-700">
            No results for &ldquo;{filters.search}&rdquo;
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {filtered.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            rank={showRank ? i + 1 : undefined}
            onOpen={setSelected}
            compact={compact}
          />
        ))}
      </div>

      {selected && (
        <PostModal post={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
