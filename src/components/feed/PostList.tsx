"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import { PostModal } from "./PostModal";
import { useKeyboardNav } from "./useKeyboardNav";
import type { RankedPost, SortMode } from "../../lib/reddit/types";
import { useFeedStore } from "../../stores/feedStore";

const PAGE_SIZE    = 20; // posts per page — keeps initial paint fast on mobile
const LOAD_MORE_BY = 20; // posts added on each "Load more" click

interface PostListProps {
  posts:         RankedPost[];
  showRank?:     boolean;
  compact?:      boolean;
  emptyMessage?: string;
}

function applySortClient(posts: RankedPost[], sort: SortMode): RankedPost[] {
  return [...posts].sort((a, b) => {
    switch (sort) {
      case "trending":   return b.scores.momentum   - a.scores.momentum;
      case "hot":        return b.scores.engagement - a.scores.engagement;
      case "new":        return b.created_utc       - a.created_utc;
      case "top":        return b.score             - a.score;
      default:           return b.scores.final      - a.scores.final;
    }
  });
}

function getTimeGroup(hoursOld: number): string {
  if (hoursOld <= 1)  return "Last hour";
  if (hoursOld <= 4)  return "Last 4 hours";
  if (hoursOld <= 24) return "Last 24 hours";
  return "Older";
}

export function PostList({
  posts,
  showRank = false,
  compact  = false,
  emptyMessage = "No posts found.",
}: PostListProps) {
  const [selected,     setSelected]     = useState<RankedPost | null>(null);
  const [visible,      setVisible]      = useState(PAGE_SIZE);
  const [activeIndex,  setActiveIndex]  = useState<number | null>(null);
  const { filters } = useFeedStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset visible count whenever filters or source posts change
  useEffect(() => { setVisible(PAGE_SIZE); }, [filters, posts]);

  const filtered = useMemo(() => {
    let result = posts;

    if (filters.subreddits.length > 0) {
      result = result.filter((p) =>
        filters.subreddits.some(
          (s) => s.toLowerCase() === p.subreddit.toLowerCase()
        )
      );
    }

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subreddit.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }

    if (filters.minScore > 0) {
      result = result.filter((p) => p.score >= filters.minScore);
    }

    const timeMap: Record<string, number> = {
      "1h": 1, "4h": 4, "12h": 12, "24h": 24, "3d": 72, "7d": 168,
    };
    if (filters.time !== "all" && timeMap[filters.time]) {
      result = result.filter((p) => p.hoursOld <= timeMap[filters.time]);
    }

    return applySortClient(result, filters.sort);
  }, [posts, filters]);

  // Keyboard navigation
  useKeyboardNav({
    posts: filtered.slice(0, visible),
    activeIndex,
    setActiveIndex,
    onOpenModal: setSelected,
    onCloseModal: () => setSelected(null),
    modalOpen: selected !== null,
  });

  // Auto-scroll active card into view
  useEffect(() => {
    if (activeIndex !== null) {
      document
        .querySelector('[data-post-active="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  // Intersection Observer — auto-load more when the sentinel scrolls into view
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visible < filtered.length) {
          setVisible((v) => Math.min(v + LOAD_MORE_BY, filtered.length));
        }
      },
      { rootMargin: "200px" } // start loading 200px before the button is visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, filtered.length]);

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

  const shown    = filtered.slice(0, visible);
  const hasMore  = visible < filtered.length;
  const remaining = filtered.length - visible;

  // Build the rendered list with time-group dividers
  // Only show dividers when time filter is not "1h" (only one group would be visible)
  const showDividers = filters.time !== "1h";
  const items: React.ReactNode[] = [];
  let lastGroup: string | null = null;

  shown.forEach((post, i) => {
    const group = getTimeGroup(post.hoursOld);
    if (showDividers && group !== lastGroup) {
      if (lastGroup !== null) {
        // Insert divider between groups (not before the first group)
        items.push(
          <div
            key={`divider-${group}`}
            className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider py-2 px-1 flex items-center gap-2"
          >
            <span>{group}</span>
            <span className="flex-1 h-px bg-zinc-800/60" />
          </div>
        );
      }
      lastGroup = group;
    }

    items.push(
      <PostCard
        key={post.id}
        post={post}
        rank={showRank ? i + 1 : undefined}
        onOpen={setSelected}
        compact={compact}
        active={activeIndex === i}
      />
    );
  });

  return (
    <>
      <div className="space-y-2">
        {items}
      </div>

      {/* Load more — auto-triggered by scroll, also manually clickable */}
      {hasMore && (
        <div ref={loadMoreRef} className="pt-4 pb-8 flex flex-col items-center gap-2">
          <button
            onClick={() => setVisible((v) => Math.min(v + LOAD_MORE_BY, filtered.length))}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
          >
            Load {Math.min(LOAD_MORE_BY, remaining)} more
            <span className="ml-1.5 text-zinc-500">({remaining} left)</span>
          </button>
        </div>
      )}

      {/* All loaded indicator */}
      {!hasMore && filtered.length > PAGE_SIZE && (
        <div className="pt-4 pb-8 text-center text-[11px] text-zinc-600">
          All {filtered.length} posts loaded
        </div>
      )}

      {selected && (
        <PostModal post={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
