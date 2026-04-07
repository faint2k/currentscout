"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBREDDITS, SUBREDDITS_BY_CATEGORY, CATEGORIES } from "../../lib/utils/subreddits";
import { useFeedStore } from "../../stores/feedStore";

const TIER_DOT: Record<number, string> = {
  1: "bg-violet-500",
  2: "bg-blue-500",
  3: "bg-zinc-500",
  4: "bg-zinc-600",
};

export function Sidebar() {
  const pathname = usePathname();
  const { filters, setFilters } = useFeedStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(["Local AI", "Frontier AI", "Research"])
  );
  const [showAll, setShowAll] = useState(false);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const toggleSubreddit = (name: string) => {
    const current = filters.subreddits;
    if (current.includes(name)) {
      setFilters({ subreddits: current.filter((s) => s !== name) });
    } else {
      setFilters({ subreddits: [...current, name] });
    }
  };

  const isSubActive = (name: string) =>
    pathname === `/r/${name}`;

  const isSubFiltered = (name: string) =>
    filters.subreddits.includes(name);

  const visibleCats = showAll ? CATEGORIES : CATEGORIES.slice(0, 8);

  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col border-r border-zinc-800/60 h-[calc(100vh-48px)] sticky top-12 overflow-y-auto">
      <div className="p-3 space-y-0.5">
        {/* Top nav */}
        <SidebarLink href="/"            label="Overview"    icon="⬛" active={pathname === "/"} />
        <SidebarLink href="/trending"    label="Trending"    icon="↑" active={pathname === "/trending"} />
        <SidebarLink href="/high-signal" label="High Signal" icon="◆" active={pathname === "/high-signal"} />
      </div>

      <div className="px-3 pt-1 pb-2">
        <div className="h-px bg-zinc-800/60" />
      </div>

      {/* Filter indicator */}
      {filters.subreddits.length > 0 && (
        <div className="mx-3 mb-2 px-2 py-1.5 bg-violet-900/20 border border-violet-700/30 rounded text-xs text-violet-300 flex items-center justify-between">
          <span>{filters.subreddits.length} filtered</span>
          <button
            onClick={() => setFilters({ subreddits: [] })}
            className="text-violet-400 hover:text-violet-200 text-[10px] underline"
          >
            clear
          </button>
        </div>
      )}

      {/* Categories + subreddits */}
      <div className="px-3 space-y-0.5 pb-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-1.5">
          Communities
        </p>

        {visibleCats.map((cat) => {
          const subs = SUBREDDITS_BY_CATEGORY[cat];
          if (!subs?.length) return null;
          const expanded = expandedCats.has(cat);

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCat(cat)}
                className="w-full flex items-center justify-between px-1.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <span className="font-medium">{cat}</span>
                <span className="text-zinc-600 text-[10px]">
                  {expanded ? "▾" : "▸"} {subs.length}
                </span>
              </button>

              {expanded && (
                <div className="ml-2 space-y-0.5 mt-0.5">
                  {subs.map((sub) => {
                    const active   = isSubActive(sub.name);
                    const filtered = isSubFiltered(sub.name);
                    return (
                      <div key={sub.name} className="flex items-center gap-1">
                        {/* Filter checkbox */}
                        <button
                          onClick={() => toggleSubreddit(sub.name)}
                          className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                            filtered
                              ? "bg-violet-600 border-violet-500"
                              : "border-zinc-600 hover:border-zinc-400"
                          }`}
                          title={filtered ? "Remove from filter" : "Add to filter"}
                        >
                          {filtered && <span className="text-white text-[8px]">✓</span>}
                        </button>

                        {/* Tier dot + link */}
                        <Link
                          href={`/r/${sub.name}`}
                          className={`flex items-center gap-1.5 flex-1 px-1.5 py-0.5 rounded text-xs transition-colors ${
                            active
                              ? "bg-zinc-700/80 text-zinc-100"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TIER_DOT[sub.tier]}`} />
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

        {!showAll && CATEGORIES.length > 8 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1.5 py-1 transition-colors"
          >
            + {CATEGORIES.length - 8} more categories
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="mt-auto p-3 border-t border-zinc-800/60">
        <p className="text-[10px] text-zinc-600 mb-1.5">Tier weights</p>
        {[
          { color: "bg-violet-500", label: "Tier 1 — 1.5×" },
          { color: "bg-blue-500",   label: "Tier 2 — 1.3×" },
          { color: "bg-zinc-500",   label: "Tier 3 — 1.15×" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}

function SidebarLink({
  href, label, icon, active,
}: {
  href: string; label: string; icon: string; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      }`}
    >
      <span className="text-[10px]">{icon}</span>
      {label}
    </Link>
  );
}
