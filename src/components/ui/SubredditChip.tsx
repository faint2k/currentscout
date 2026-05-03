"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSubredditConfig } from "../../lib/utils/subreddits";
import { buildSourcePath } from "../../lib/utils/returnNavigation";

const TIER_COLORS: Record<number, string> = {
  1: "text-violet-400 border-violet-700/50 bg-violet-900/20",
  2: "text-blue-400   border-blue-700/50   bg-blue-900/20",
  3: "text-zinc-400   border-zinc-700/30   bg-zinc-800/40",
};

interface SubredditChipProps {
  name: string;
  clickable?: boolean;
  className?: string;
}

export function SubredditChip({ name, clickable = true, className = "" }: SubredditChipProps) {
  const pathname = usePathname();
  const config = getSubredditConfig(name);
  const tier   = config?.tier ?? 3;
  const color  = TIER_COLORS[tier] ?? TIER_COLORS[3];

  const base = `inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border ${color} ${className}`;
  const currentSearch = typeof window !== "undefined" ? window.location.search : "";
  const currentSearchParams = new URLSearchParams(currentSearch);
  const sourcePath = buildSourcePath(pathname, currentSearch.replace(/^\?/, ""), currentSearchParams.get("from"));
  const href = sourcePath ? `/r/${name}?from=${encodeURIComponent(sourcePath)}` : `/r/${name}`;

  if (clickable) {
    return (
      <Link href={href} className={`${base} hover:opacity-80 transition-opacity`}>
        r/{name}
      </Link>
    );
  }

  return <span className={base}>r/{name}</span>;
}
