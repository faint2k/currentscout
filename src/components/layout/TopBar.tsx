"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeedStore } from "../../stores/feedStore";
import { MobileNav } from "./MobileNav";
import type { SortMode, TimeFilter } from "../../lib/reddit/types";

const SORT_LABELS: Record<SortMode, string> = {
  weighted: "Best",
  trending: "Trending",
  hot: "Hot",
  new: "New",
  top: "Top",
};

const TIME_LABELS: Record<TimeFilter, string> = {
  "1h": "1h",
  "4h": "4h",
  "12h": "12h",
  "24h": "24h",
  "3d": "3d",
  "7d": "7d",
  all: "All time",
};

export function TopBar() {
  const pathname = usePathname();
  const { filters, setFilters } = useFeedStore();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const currentSubreddit = pathname.startsWith("/r/")
    ? decodeURIComponent(pathname.replace("/r/", "").split("/")[0] || "")
    : null;

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/trending", label: "Trending" },
    { href: "/high-signal", label: "High Signal" },
  ];

  const activeFilterCount =
    (filters.search.trim() ? 1 : 0) +
    (filters.subreddits.length > 0 ? 1 : 0) +
    (filters.minScore > 0 ? 1 : 0);

  return (
    <>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-3 sm:px-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100 lg:hidden"
            aria-label="Open menu and filters"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
              <span className="h-px w-4 bg-current" />
            </span>
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-[0_0_24px_rgba(124,58,237,0.22)]">
              C
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-white">
                CurrentScout
              </div>
              <div className="hidden text-[11px] text-zinc-500 sm:block lg:hidden">
                Ranked AI signal
              </div>
            </div>
          </Link>

          <nav className="ml-1 hidden items-center gap-1 lg:flex">
            {navLinks.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {currentSubreddit && (
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100 transition-colors hover:border-violet-400/40 hover:bg-violet-500/14 lg:flex"
              aria-label="Return to the main CurrentScout feed"
            >
              <span aria-hidden="true">←</span>
              <span>Back to CurrentScout</span>
              <span className="text-violet-200/70">r/{currentSubreddit}</span>
            </Link>
          )}

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              {currentSubreddit && (
                <Link
                  href="/"
                  className="flex items-center gap-1.5 rounded-xl border border-violet-500/25 bg-violet-500/10 px-2.5 py-2 text-[11px] font-medium text-violet-100 transition-colors hover:border-violet-400/40 hover:bg-violet-500/14"
                  aria-label="Back to the main CurrentScout feed"
                >
                  <span aria-hidden="true">←</span>
                  <span>Feed</span>
                </Link>
              )}

              <button
                onClick={() => setMobileNavOpen(true)}
                className="flex min-w-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/90"
                aria-label="Open mobile filters"
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-medium text-zinc-100">
                    {SORT_LABELS[filters.sort]} · {TIME_LABELS[filters.time]}
                  </div>
                  <div className="truncate text-[10px] text-zinc-500">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
                      : "Search, score, and communities"}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  Filters
                </span>
              </button>
            </div>

            <div className="hidden flex-1 max-w-lg md:block lg:min-w-[20rem]">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">⌕</span>
                <input
                  id="topbar-search"
                  name="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  placeholder="Search posts, subreddits, authors…"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/60 focus:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
