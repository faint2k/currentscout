"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBREDDITS_BY_CATEGORY, CATEGORIES } from "../../lib/utils/subreddits";
import { useFeedStore } from "../../stores/feedStore";

const TIER_DOT: Record<number, string> = {
  1: "bg-violet-500",
  2: "bg-blue-500",
  3: "bg-zinc-500",
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
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
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

  const isSubActive = (name: string) => pathname === `/r/${name}`;
  const isSubFiltered = (name: string) => filters.subreddits.includes(name);
  const visibleCats = showAll ? CATEGORIES : CATEGORIES.slice(0, 8);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-60 shrink-0 overflow-y-auto border-r border-zinc-800/60 lg:flex lg:flex-col">
      <div className="p-3">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-2.5">
          <div className="mb-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Browse modes
            </p>
          </div>
          <div className="space-y-1">
            <SidebarLink href="/" label="Overview" icon="⬛" active={pathname === "/"} />
            <SidebarLink href="/trending" label="Trending" icon="↑" active={pathname === "/trending"} />
            <SidebarLink href="/high-signal" label="High Signal" icon="◆" active={pathname === "/high-signal"} />
          </div>
        </div>
      </div>

      {filters.subreddits.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2 text-xs text-violet-100">
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

      <div className="px-3 pb-4">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-2.5">
          <div className="mb-2 px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Communities
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Open a community to browse it. Tap the box to keep it in the current feed filter.
            </p>
          </div>

          <div className="space-y-1">
            {visibleCats.map((cat) => {
              const subs = SUBREDDITS_BY_CATEGORY[cat];
              if (!subs?.length) return null;
              const expanded = expandedCats.has(cat);

              return (
                <div key={cat} className="rounded-xl border border-zinc-800/70 bg-zinc-950/60">
                  <button
                    onClick={() => toggleCat(cat)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-zinc-900"
                  >
                    <span className="text-sm font-medium text-zinc-200">{cat}</span>
                    <span className="text-xs text-zinc-500">
                      {expanded ? "▾" : "▸"} {subs.length}
                    </span>
                  </button>

                  {expanded && (
                    <div className="space-y-1 border-t border-zinc-800/70 px-2 py-2">
                      {subs.map((sub) => {
                        const active = isSubActive(sub.name);
                        const filtered = isSubFiltered(sub.name);
                        return (
                          <div key={sub.name} className="flex items-center gap-2">
                            <button
                              onClick={() => toggleSubreddit(sub.name)}
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                filtered
                                  ? "border-violet-500 bg-violet-600"
                                  : "border-zinc-600 hover:border-zinc-400"
                              }`}
                              title="Filter feed to this community"
                            >
                              {filtered && <span className="text-[9px] text-white">✓</span>}
                            </button>

                            <Link
                              href={`/r/${sub.name}`}
                              className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                active
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

          {!showAll && CATEGORIES.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-2 px-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
            >
              + {CATEGORIES.length - 8} more categories
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto p-3 pt-0">
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Tier weights
          </p>
          <div className="mt-2 space-y-1.5 text-[11px] text-zinc-400">
            {[
              { color: "bg-violet-500", label: "Tier 1", detail: "1.5× weight" },
              { color: "bg-blue-500", label: "Tier 2", detail: "1.3× weight" },
              { color: "bg-zinc-500", label: "Tier 3", detail: "1.15× weight" },
            ].map(({ color, label, detail }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
                  <span>{label}</span>
                </div>
                <span className="text-zinc-500">{detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-950"
          : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
      }`}
    >
      <span className="text-[10px]">{icon}</span>
      {label}
    </Link>
  );
}
