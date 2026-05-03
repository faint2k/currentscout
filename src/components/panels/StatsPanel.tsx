"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SUBREDDITS, CATEGORIES } from "../../lib/utils/subreddits";

const TIER_COLOR = {
  1: "text-violet-300",
  2: "text-blue-300",
  3: "text-zinc-300",
  4: "text-zinc-400",
} as const;

export function StatsPanel() {
  const [formulaOpen, setFormulaOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
            C
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">CurrentScout</h2>
            <p className="text-[11px] text-zinc-500">Ranked signal from 44 AI communities</p>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-zinc-300">
          A feed for practitioners who want to find what’s moving through AI communities quickly,
          without drowning in generic noise.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/90">
          Data quality status
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">
          Some rankings are currently estimated from feed position, freshness, title quality, and
          community weight while Reddit API access is pending.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-4">
        <button
          onClick={() => setFormulaOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              How ranking works
            </p>
            <p className="mt-1 text-xs text-zinc-500">What influences the estimated signal score</p>
          </div>
          <span className="text-sm text-zinc-500">{formulaOpen ? "▴" : "▾"}</span>
        </button>

        {formulaOpen && (
          <>
            <div className="mt-3 space-y-2 text-xs">
              {[
                { label: "Position", pct: "35%", desc: "Feed position adjusted by community weight", color: "bg-violet-500" },
                { label: "Freshness", pct: "25%", desc: "Recency decay over roughly 48 hours", color: "bg-blue-500" },
                { label: "Engagement", pct: "30%", desc: "Score + comments when the data is available", color: "bg-emerald-500" },
                { label: "Quality", pct: "10%", desc: "Title depth and practitioner signal heuristics", color: "bg-amber-500" },
              ].map(({ label, pct, desc, color }) => (
                <div key={label} className="flex items-start gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/70 px-3 py-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-zinc-100">{label}</span>
                      <span className="font-mono text-zinc-400">{pct}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              Tier weighting multiplies the total score by roughly 1.0–1.5× based on community importance.
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Coverage
        </p>
        <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-zinc-500">Tracked communities</div>
          <div className="text-right font-medium text-zinc-100">{SUBREDDITS.length}</div>
          <div className="text-zinc-500">Categories</div>
          <div className="text-right font-medium text-zinc-100">{CATEGORIES.length}</div>
          <div className="text-zinc-500">Refresh cadence</div>
          <div className="text-right font-medium text-zinc-100">15 min</div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/70 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Tier 1 communities
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Highest-weight communities in the CurrentScout ranking model.
        </p>
        <div className="mt-3 space-y-1.5">
          {SUBREDDITS.filter((s) => s.tier === 1).map((sub) => (
            <Link
              key={sub.name}
              href={`/r/${sub.name}`}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-950 hover:text-zinc-100"
            >
              <span className={TIER_COLOR[sub.tier]}>r/{sub.name}</span>
              <span className="font-mono text-xs text-zinc-500">{sub.weight.toFixed(2)}×</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
