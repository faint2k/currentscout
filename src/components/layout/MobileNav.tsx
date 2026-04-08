"use client";

import React, { useState, useEffect } from "react";
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

interface MobileNavProps {
  open:    boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { filters, setFilters } = useFeedStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    new Set(["Local AI", "Frontier AI"])
  );

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const navLinks = [
    { href: "/",            label: "Overview",    icon: "⬛" },
    { href: "/trending",    label: "Trending",    icon: "↑"  },
    { href: "/high-signal", label: "High Signal", icon: "◆"  },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 z-[51] w-72 bg-zinc-950 border-r border-zinc-800 overflow-y-auto lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="font-bold text-white text-sm">CurrentScout</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 text-lg leading-none p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-0.5">
          {navLinks.map(({ href, label, icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
              >
                <span className="text-xs">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>

        <div className="px-3 py-2">
          <div className="h-px bg-zinc-800" />
        </div>

        {/* Filter indicator */}
        {filters.subreddits.length > 0 && (
          <div className="mx-3 mb-2 px-3 py-2 bg-violet-900/20 border border-violet-700/30 rounded-lg text-xs text-violet-300 flex items-center justify-between">
            <span>{filters.subreddits.length} filtered</span>
            <button
              onClick={() => setFilters({ subreddits: [] })}
              className="text-violet-400 hover:text-violet-200 underline"
            >
              clear
            </button>
          </div>
        )}

        {/* Communities */}
        <div className="px-3 pb-8">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1 mb-2">
            Communities
          </p>

          {CATEGORIES.map((cat) => {
            const subs = SUBREDDITS_BY_CATEGORY[cat];
            if (!subs?.length) return null;
            const expanded = expandedCats.has(cat);

            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="font-medium">{cat}</span>
                  <span className="text-zinc-600 text-xs">
                    {expanded ? "▾" : "▸"} {subs.length}
                  </span>
                </button>

                {expanded && (
                  <div className="ml-2 space-y-0.5 mt-0.5 mb-1">
                    {subs.map((sub) => {
                      const isFiltered = filters.subreddits.includes(sub.name);
                      const isActive   = pathname === `/r/${sub.name}`;
                      return (
                        <div key={sub.name} className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const current = filters.subreddits;
                              setFilters({
                                subreddits: isFiltered
                                  ? current.filter((s) => s !== sub.name)
                                  : [...current, sub.name],
                              });
                            }}
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                              isFiltered
                                ? "bg-violet-600 border-violet-500"
                                : "border-zinc-600 hover:border-zinc-400"
                            }`}
                          >
                            {isFiltered && <span className="text-white text-[8px]">✓</span>}
                          </button>

                          <Link
                            href={`/r/${sub.name}`}
                            className={`flex items-center gap-1.5 flex-1 px-2 py-1 rounded text-sm transition-colors ${
                              isActive
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
        </div>
      </div>
    </>
  );
}
