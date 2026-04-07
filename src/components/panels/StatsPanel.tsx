"use client";

import React from "react";
import Link from "next/link";
import { SUBREDDITS, CATEGORIES } from "../../lib/utils/subreddits";

const TIER_COLOR = {
  1: "text-violet-400",
  2: "text-blue-400",
  3: "text-zinc-400",
  4: "text-zinc-500",
} as const;

export function StatsPanel() {
  return (
    <div className="space-y-4">
      {/* About */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            A
          </div>
          <h2 className="text-xs font-semibold text-zinc-200">The AI Hub</h2>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          A trending-first Reddit dashboard for the AI community. Posts ranked by momentum, engagement,
          and subreddit signal weight.
        </p>
      </div>

      {/* Score formula */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Ranking Formula
        </p>
        <div className="space-y-1 text-[10px]">
          {[
            { label: "Momentum",   pct: "35%", desc: "Upvotes/hour velocity",      color: "bg-violet-500" },
            { label: "Recency",    pct: "25%", desc: "Time decay over 7 days",     color: "bg-blue-500" },
            { label: "Engagement", pct: "30%", desc: "Score + comments (log1p)",   color: "bg-green-500" },
            { label: "Quality",    pct: "10%", desc: "Technical depth heuristics", color: "bg-yellow-500" },
          ].map(({ label, pct, desc, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
              <span className="text-zinc-300 w-16">{label}</span>
              <span className="text-zinc-400 font-mono w-8">{pct}</span>
              <span className="text-zinc-600 truncate">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-zinc-700 mt-2 italic">
          × subreddit tier weight (1.0–1.5×)
        </p>
      </div>

      {/* Community stats */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Communities
        </p>
        <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
          <div className="text-zinc-400">Tracked</div>
          <div className="text-zinc-200 font-medium text-right">{SUBREDDITS.length} subreddits</div>
          <div className="text-zinc-400">Categories</div>
          <div className="text-zinc-200 font-medium text-right">{CATEGORIES.length}</div>
          <div className="text-zinc-400">Cache TTL</div>
          <div className="text-zinc-200 font-medium text-right">15 min</div>
        </div>
      </div>

      {/* Top communities by tier */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Tier 1 Communities
        </p>
        <div className="space-y-0.5">
          {SUBREDDITS.filter((s) => s.tier === 1).map((sub) => (
            <Link
              key={sub.name}
              href={`/r/${sub.name}`}
              className="flex items-center justify-between py-0.5 text-[11px] hover:text-zinc-200 transition-colors"
            >
              <span className={`${TIER_COLOR[sub.tier]}`}>r/{sub.name}</span>
              <span className="text-zinc-600">{sub.weight.toFixed(2)}×</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Data source */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
          Data Source
        </p>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Reddit public JSON API (free, no auth required). Hot + rising
          feeds fetched per subreddit. All data is read-only.
        </p>
      </div>
    </div>
  );
}
