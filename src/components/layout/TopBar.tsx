"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFeedStore } from "../../stores/feedStore";

export function TopBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { filters, setFilters } = useFeedStore();
  const [search, setSearch] = useState(filters.search);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFilters({ search: search.trim() });
    },
    [search, setFilters]
  );

  const navLinks = [
    { href: "/",            label: "Overview" },
    { href: "/trending",    label: "Trending" },
    { href: "/high-signal", label: "High Signal" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-4 h-12 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-bold text-white text-sm tracking-tight hidden sm:block">
            CurrentScout
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-2">
          {navLinks.map(({ href, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-auto">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">⌕</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, subreddits…"
              className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-md pl-7 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-600/60 focus:bg-zinc-800 transition-colors"
            />
          </div>
        </form>

        {/* Sort quick-select */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as typeof filters.sort })}
          className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-violet-600/60 hidden md:block"
        >
          <option value="weighted">Best</option>
          <option value="trending">Trending</option>
          <option value="hot">Hot</option>
          <option value="new">New</option>
          <option value="top">Top</option>
        </select>

        {/* Time filter quick-select */}
        <select
          value={filters.time}
          onChange={(e) => setFilters({ time: e.target.value as typeof filters.time })}
          className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-violet-600/60 hidden md:block"
        >
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="12h">12h</option>
          <option value="24h">24h</option>
          <option value="3d">3d</option>
          <option value="7d">7d</option>
          <option value="all">All</option>
        </select>
      </div>
    </header>
  );
}
