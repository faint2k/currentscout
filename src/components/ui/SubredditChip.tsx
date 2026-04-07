import React from "react";
import Link from "next/link";
import { getSubredditConfig } from "../../lib/utils/subreddits";

const TIER_COLORS: Record<number, string> = {
  1: "text-violet-400 border-violet-700/50 bg-violet-900/20",
  2: "text-blue-400   border-blue-700/50   bg-blue-900/20",
  3: "text-zinc-300   border-zinc-700/50   bg-zinc-800/60",
  4: "text-zinc-400   border-zinc-700/30   bg-zinc-800/40",
};

interface SubredditChipProps {
  name: string;
  clickable?: boolean;
  className?: string;
}

export function SubredditChip({ name, clickable = true, className = "" }: SubredditChipProps) {
  const config = getSubredditConfig(name);
  const tier   = config?.tier ?? 4;
  const color  = TIER_COLORS[tier] ?? TIER_COLORS[4];

  const base = `inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border ${color} ${className}`;

  if (clickable) {
    return (
      <Link href={`/r/${name}`} className={`${base} hover:opacity-80 transition-opacity`}>
        r/{name}
      </Link>
    );
  }

  return <span className={base}>r/{name}</span>;
}
