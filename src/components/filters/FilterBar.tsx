"use client";

import React from "react";
import { useFeedStore } from "../../stores/feedStore";
import type { SortMode, TimeFilter } from "../../lib/reddit/types";

const SORT_OPTIONS: { value: SortMode; label: string; title: string }[] = [
  { value: "weighted", label: "Best", title: "Highest combined trend + engagement score" },
  { value: "trending", label: "Trending", title: "Fastest rising by momentum (velocity)" },
  { value: "hot", label: "Hot", title: "Highest engagement depth" },
  { value: "new", label: "New", title: "Most recently posted" },
  { value: "top", label: "Top", title: "Highest raw Reddit score" },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "12h", label: "12h" },
  { value: "24h", label: "24h" },
  { value: "3d", label: "3d" },
  { value: "7d", label: "7d" },
  { value: "all", label: "All" },
];

interface FilterBarProps {
  totalPosts?: number;
  fetchedAt?: number;
  cached?: boolean;
  label?: string;
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
    ? new Date(fetchedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="sticky top-14 z-30 mb-5 hidden bg-zinc-950/92 pb-3 pt-1 backdrop-blur-md md:block">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-3 py-3 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
        <div className="mb-3 flex flex-wrap items-start gap-3 border-b border-zinc-800/70 pb-3">
          <div className="mr-auto min-w-0">
            {label && <h1 className="text-sm font-semibold text-zinc-100">{label}</h1>}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {totalPosts !== undefined && (
                <span className="text-zinc-400">{totalPosts} posts in view</span>
              )}
              {freshness && (
                <span
                  className={`inline-flex items-center gap-1.5 ${cached ? "text-amber-300/80" : "text-emerald-300/85"}`}
                  title={cached ? "Served from cache" : "Fresh fetch"}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${cached ? "bg-amber-400" : "bg-emerald-400"}`} />
                  Updated {freshness}
                  <span className="text-zinc-500">· {cached ? "cached" : "fresh"}</span>
                </span>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="rounded-lg border border-zinc-700/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)_auto]">
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Sort by
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-1">
              {SORT_OPTIONS.map(({ value, label: sortLabel, title }) => (
                <button
                  key={value}
                  onClick={() => setFilters({ sort: value })}
                  title={title}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filters.sort === value
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                  }`}
                >
                  {sortLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Time window
            </div>
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-1">
              {TIME_OPTIONS.map(({ value, label: timeLabel }) => (
                <button
                  key={value}
                  onClick={() => setFilters({ time: value })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filters.time === value
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                  }`}
                >
                  {timeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[11rem]">
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Raw Reddit score
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/70 px-3 py-2.5">
              <span className="text-xs text-zinc-400">Min</span>
              <input
                id="filterbar-min-score"
                name="minScore"
                type="number"
                min={0}
                max={10000}
                step={50}
                value={filters.minScore || ""}
                onChange={(e) =>
                  setFilters({ minScore: parseInt(e.target.value || "0", 10) })
                }
                placeholder="0"
                className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
