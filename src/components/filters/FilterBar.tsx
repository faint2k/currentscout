"use client";

import React from "react";
import { useFeedStore } from "../../stores/feedStore";
import type { SortMode, TimeFilter } from "../../lib/reddit/types";

const SORT_OPTIONS: { value: SortMode; label: string; title: string }[] = [
  { value: "weighted",  label: "Best",     title: "Highest combined trend + engagement score" },
  { value: "trending",  label: "Trending", title: "Fastest rising by momentum (velocity)" },
  { value: "hot",       label: "Hot",      title: "Highest engagement depth" },
  { value: "new",       label: "New",      title: "Most recently posted" },
  { value: "top",       label: "Top",      title: "Highest raw Reddit score" },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "1h",  label: "1h" },
  { value: "4h",  label: "4h" },
  { value: "12h", label: "12h" },
  { value: "24h", label: "24h" },
  { value: "3d",  label: "3d" },
  { value: "7d",  label: "7d" },
  { value: "all", label: "All" },
];

interface FilterBarProps {
  totalPosts?: number;
  fetchedAt?:  number;
  cached?:     boolean;
  label?:      string;
}

export function FilterBar({
  totalPosts,
  fetchedAt,
  cached,
  label,
}: FilterBarProps) {
  const { filters, setFilters, resetFilters } = useFeedStore();

  const hasActiveFilters =
    filters.subreddits.length > 0 ||
    filters.search.trim() !== "" ||
    filters.minScore > 0 ||
    filters.sort !== "weighted" ||
    filters.time !== "24h";

  const freshness = fetchedAt
    ? (() => {
        const mins = Math.floor((Date.now() - fetchedAt) / 60000);
        if (mins < 1) return "just now";
        if (mins === 1) return "1 min ago";
        return `${mins} min ago`;
      })()
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
      {/* Label + count */}
      <div className="flex items-center gap-2 mr-auto">
        {label && (
          <h1 className="text-sm font-semibold text-zinc-200">{label}</h1>
        )}
        {totalPosts !== undefined && (
          <span className="text-xs text-zinc-600">{totalPosts} posts</span>
        )}
        {freshness && (
          <span
            className={`text-[10px] ${cached ? "text-zinc-600" : "text-green-600"}`}
            title={cached ? "From cache" : "Fresh data"}
          >
            {cached ? "⬤" : "◎"} {freshness}
          </span>
        )}
      </div>

      {/* Sort pills */}
      <div className="flex items-center gap-1 bg-zinc-800/60 rounded-md p-0.5">
        {SORT_OPTIONS.map(({ value, label: sortLabel, title }) => (
          <button
            key={value}
            onClick={() => setFilters({ sort: value })}
            title={title}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filters.sort === value
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {sortLabel}
          </button>
        ))}
      </div>

      {/* Time pills */}
      <div className="flex items-center gap-0.5 bg-zinc-800/60 rounded-md p-0.5">
        {TIME_OPTIONS.map(({ value, label: timeLabel }) => (
          <button
            key={value}
            onClick={() => setFilters({ time: value })}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.time === value
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {timeLabel}
          </button>
        ))}
      </div>

      {/* Min score filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600">min ▲</span>
        <input
          type="number"
          min={0}
          max={10000}
          step={50}
          value={filters.minScore || ""}
          onChange={(e) =>
            setFilters({ minScore: parseInt(e.target.value || "0", 10) })
          }
          placeholder="0"
          className="w-16 bg-zinc-800/80 border border-zinc-700/50 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-violet-600/60"
        />
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 underline transition-colors"
        >
          reset
        </button>
      )}
    </div>
  );
}
