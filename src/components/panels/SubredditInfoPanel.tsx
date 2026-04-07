import React from "react";
import Link from "next/link";
import { getSubredditConfig, SUBREDDITS } from "../../lib/utils/subreddits";

interface SubredditInfoPanelProps {
  name: string;
}

const TIER_LABEL: Record<number, string> = {
  1: "Tier 1 — Core Signal",
  2: "Tier 2 — Major Community",
  3: "Tier 3 — Specialised",
  4: "Tier 4 — General",
};

const TIER_COLOR: Record<number, string> = {
  1: "text-violet-400",
  2: "text-blue-400",
  3: "text-zinc-400",
  4: "text-zinc-500",
};

export function SubredditInfoPanel({ name }: SubredditInfoPanelProps) {
  const config = getSubredditConfig(name);
  const sameCat = config
    ? SUBREDDITS.filter((s) => s.category === config.category && s.name !== name).slice(0, 8)
    : [];

  return (
    <div className="space-y-4">
      {/* Sub info */}
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-sm font-semibold text-zinc-200 mb-1">r/{name}</p>
        {config ? (
          <>
            <p className="text-[11px] text-zinc-500 mb-2">{config.description}</p>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-zinc-600">Category</span>
                <span className="text-zinc-300">{config.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Tier</span>
                <span className={TIER_COLOR[config.tier]}>{TIER_LABEL[config.tier]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Score weight</span>
                <span className="text-zinc-300 font-mono">{config.weight.toFixed(2)}×</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-zinc-600 italic">Not in tracked list</p>
        )}
      </div>

      {/* Open on Reddit */}
      <a
        href={`https://reddit.com/r/${name}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-2 bg-orange-700/80 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Open r/{name} on Reddit ↗
      </a>

      {/* Related subs */}
      {sameCat.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
            Related ({config?.category})
          </p>
          <div className="space-y-0.5">
            {sameCat.map((sub) => (
              <Link
                key={sub.name}
                href={`/r/${sub.name}`}
                className={`flex items-center justify-between py-0.5 text-[11px] ${TIER_COLOR[sub.tier]} hover:text-zinc-200 transition-colors`}
              >
                <span>r/{sub.name}</span>
                <span className="text-zinc-600">{sub.weight.toFixed(2)}×</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
