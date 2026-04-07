"use client";

import React from "react";
import { SCORE_WEIGHTS, BADGE_THRESHOLDS } from "../../lib/ranking/weights";

export function TrendingPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-xs font-semibold text-zinc-200 mb-1.5">Trending Feed</p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Posts are ranked by <strong className="text-zinc-300">momentum first</strong> —
          the velocity of upvote accumulation relative to post age. A high momentum
          score means a post is gaining traction faster than typical.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Momentum Formula
        </p>
        <div className="bg-zinc-800/50 rounded p-2 font-mono text-[10px] text-zinc-400 leading-relaxed">
          <span className="text-violet-400">velocity</span>
          {" = score / max(age_hours, 0.25)"}
          <br />
          <span className="text-violet-400">momentum</span>
          {" = log₁₊(velocity) / log₁₊(2000) × 100"}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Badge Thresholds
        </p>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-orange-400">↑ Trending</span>
            <span className="text-zinc-500">momentum ≥ {BADGE_THRESHOLDS.trending}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-400">↗ Rising</span>
            <span className="text-zinc-500">recency ≥ 80 & momentum ≥ 45</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-400">● Hot</span>
            <span className="text-zinc-500">engagement ≥ {BADGE_THRESHOLDS.hot}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-400">≡ Deep Dive</span>
            <span className="text-zinc-500">comments/score ≥ {BADGE_THRESHOLDS.deepDive}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-400">◆ High Signal</span>
            <span className="text-zinc-500">final ≥ {BADGE_THRESHOLDS.highSignal}</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Score Weights
        </p>
        <div className="space-y-1 text-[10px]">
          {Object.entries(SCORE_WEIGHTS).map(([key, val]) => (
            <div key={key} className="flex justify-between text-zinc-400">
              <span className="capitalize">{key}</span>
              <span className="text-zinc-300">{(val * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
