"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBREDDITS_BY_CATEGORY, CATEGORIES } from "../../lib/utils/subreddits";
import { useFeedStore } from "../../stores/feedStore";
import type { SortMode, TimeFilter } from "../../lib/reddit/types";

const TIER_DOT: Record<number, string> = {
  1: "bg-violet-500",
  2: "bg-blue-500",
  3: "bg-zinc-500",
};

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "weighted", label: "Best" },
  { value: "trending", label: "Trending" },
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "12h", label: "12h" },
  { value: "24h", label: "24h" },
  { value: "3d", label: "3d" },
  { value: "7d", label: "7d" },
  { value: "all", label: "All time" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { filters, setFilters, resetFilters } = useFeedStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(["Local AI", "Frontier AI"])
  );

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const navLinks = [
    { href: "/", label: "Overview", icon: "⬛" },
    { href: "/trending", label: "Trending", icon: "↑" },
    { href: "/high-signal", label: "High Signal", icon: "◆" },
  ];

  const activeSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.search.trim()) parts.push("search");
    if (filters.subreddits.length > 0) parts.push(`${filters.subreddits.length} communities`);
    if (filters.minScore > 0) parts.push(`score ≥ ${filters.minScore}`);
    return parts.length > 0 ? parts.join(" • ") : "No extra filters active";
  }, [filters.minScore, filters.search, filters.subreddits.length]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 left-0 z-[51] w-[min(24rem,100vw)] overflow-y-auto border-r border-zinc-800 bg-zinc-950 lg:hidden">
        <div className="sticky top-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-zinc-100">Browse + Filters</div>
              <div className="text-[11px] text-zinc-500">{activeSummary}</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 pb-8">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                C
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">CurrentScout</div>
                <div className="text-[11px] text-zinc-500">Feed-first mobile controls</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {navLinks.map(({ href, label, icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition-colors ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/10 text-violet-100"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="mb-1 text-[10px]">{icon}</div>
                    {label}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  Search + tune
                </h2>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Keep advanced controls here so the feed starts sooner.
                </p>
              </div>
              {(filters.search.trim() || filters.subreddits.length > 0 || filters.minScore > 0) && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-200"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="mobile-search" className="mb-1.5 block text-[11px] font-medium text-zinc-300">
                Search posts or communities
              </label>
              <input
                id="mobile-search"
                name="search"
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="agents, OpenAI, LocalLLaMA…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500/60"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-zinc-300">Sort</label>
                <div className="grid grid-cols-3 gap-2">
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ sort: value })}
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                        filters.sort === value
                          ? "border-violet-500/40 bg-violet-500/12 text-violet-100"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-zinc-300">Time range</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters({ time: value })}
                      className={`rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors ${
                        filters.time === value
                          ? "border-violet-500/40 bg-violet-500/12 text-violet-100"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="mobile-min-score" className="mb-1.5 block text-[11px] font-medium text-zinc-300">
                  Min Reddit score
                </label>
                <input
                  id="mobile-min-score"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-violet-500/60"
                />
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Filters by the post’s raw Reddit score, not the estimated CurrentScout rank.
                </p>
              </div>
            </div>
          </section>

          {filters.subreddits.length > 0 && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 px-3 py-2.5 text-xs text-violet-100">
              <div className="flex items-center justify-between gap-2">
                <span>{filters.subreddits.length} community filters active</span>
                <button
                  onClick={() => setFilters({ subreddits: [] })}
                  className="text-violet-200 underline underline-offset-4"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Communities
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                Open a community to browse it. Tap the box to add it as a filter.
              </p>
            </div>

            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const subs = SUBREDDITS_BY_CATEGORY[cat];
                if (!subs?.length) return null;
                const expanded = expandedCats.has(cat);

                return (
                  <div key={cat} className="rounded-xl border border-zinc-800/80 bg-zinc-950/70">
                    <button
                      onClick={() => toggleCat(cat)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-zinc-900"
                    >
                      <span className="text-sm font-medium text-zinc-200">{cat}</span>
                      <span className="text-xs text-zinc-500">
                        {expanded ? "▾" : "▸"} {subs.length}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-1 border-t border-zinc-800 px-2 py-2">
                        {subs.map((sub) => {
                          const isFiltered = filters.subreddits.includes(sub.name);
                          const isActive = pathname === `/r/${sub.name}`;
                          return (
                            <div key={sub.name} className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const current = filters.subreddits;
                                  setFilters({
                                    subreddits: isFiltered
                                      ? current.filter((s) => s !== sub.name)
                                      : [...current, sub.name],
                                  });
                                }}
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  isFiltered
                                    ? "border-violet-500 bg-violet-600"
                                    : "border-zinc-600 hover:border-zinc-400"
                                }`}
                                title="Filter feed to this community"
                              >
                                {isFiltered && <span className="text-[9px] text-white">✓</span>}
                              </button>

                              <Link
                                href={`/r/${sub.name}`}
                                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                  isActive
                                    ? "bg-zinc-800 text-zinc-100"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TIER_DOT[sub.tier]}`} />
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
