"use client";

import React, { useState } from "react";
import { SubredditChip } from "../ui/SubredditChip";
import { timeAgo, redditUrl, displayDomain, scoreColor } from "../../lib/utils/format";
import type { RankedPost } from "../../lib/reddit/types";
import type { SignalBadge } from "../../lib/ranking/scorer";

interface PostCardFallbackProps {
  post:     RankedPost;
  rank?:    number;
  onOpen?:  (post: RankedPost) => void;
  compact?: boolean;
}

// Only "Rising" is reliable from RSS — it fires on recency + feed position,
// both of which we actually have. The rest (Trending, Hot, High Signal, Deep Dive)
// require real engagement data and are suppressed.
// No badges are reliable from RSS — position and recency inputs are estimated.
// Suppress all badges in fallback mode.
const RELIABLE_BADGES: SignalBadge[] = [];

/**
 * PostCard for RSS fallback posts.
 *
 * What RSS gives us (shown):     Feed position · Post age · Subreddit
 * What RSS does NOT give us (hidden): Upvote counts · Comment counts · Upvote ratio
 *
 * Score breakdown is relabelled to match what the numbers actually represent:
 *   Position  — feed position signal (estimated from RSS order)
 *   Freshness — recency within 48h window
 *   Keywords  — title-based quality heuristic
 *   Engagement is always 0 and omitted entirely.
 */
export function PostCardFallback({ post, rank, onOpen, compact = false }: PostCardFallbackProps) {
  const [scoreOpen, setScoreOpen] = useState(false);

  const domain     = displayDomain(post.url, post.is_self, post.subreddit);
  const redditLink = redditUrl(post.permalink);
  const finalColor = scoreColor(post.scores.final);

  // Filter badges down to the reliable subset
  const safeBadges = post.badges.filter((b) => RELIABLE_BADGES.includes(b));

  return (
    <article
      className={`group relative bg-zinc-900 border border-zinc-800/70 rounded-lg hover:border-zinc-700/80 transition-all duration-150 ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <div className="flex gap-3">
        {rank !== undefined && (
          <div className="shrink-0 flex flex-col items-center pt-0.5">
            <span className="text-[11px] text-zinc-600 font-mono w-5 text-center leading-none">
              {rank}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2 mb-1.5">
            <h2
              className={`flex-1 min-w-0 font-medium leading-snug text-zinc-100 group-hover:text-white transition-colors cursor-pointer ${
                compact ? "text-sm" : "text-[13px]"
              }`}
              onClick={() => onOpen?.(post)}
            >
              {post.title}
            </h2>
          </div>

          {/* Meta row — no score, no comments, no ratio */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
            <SubredditChip name={post.subreddit} />

            <span className="text-zinc-600">·</span>

            <span title={`Posted ${post.hoursOld.toFixed(1)}h ago`}>
              {timeAgo(post.created_utc)}
            </span>

            {!post.is_self && (
              <>
                <span className="text-zinc-600">·</span>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 truncate max-w-[120px] transition-colors"
                >
                  {domain} ↗
                </a>
              </>
            )}

            {post.link_flair_text && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500 italic text-[10px]">{post.link_flair_text}</span>
              </>
            )}

            {/* RSS provenance indicator — always shown */}
            <span className="text-zinc-600">·</span>
            <span
              className="text-[9px] text-zinc-600 font-mono border border-zinc-800 rounded px-1 py-0.5 leading-none"
              title="Scores estimated from RSS feed position — real upvote data unavailable"
            >
              RSS est.
            </span>
          </div>

          {/* Badges (safe subset) + score chip */}
          {!compact && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setScoreOpen((v) => !v)}
                className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700/50 bg-zinc-800/60 ${finalColor} hover:border-zinc-600/70 transition-colors shrink-0`}
                title="Estimated signal score — ranked by feed position × community size × freshness. Real upvote data pending API access."
              >
                ~{Math.round(post.scores.final)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Score breakdown — relabelled for honesty */}
      {scoreOpen && (
        <div className="mt-2 pt-2 border-t border-zinc-800/60 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          {(
            [
              ["Position",  post.scores.momentum],   // trendingScore = position signal
              ["Freshness", post.scores.recency],
              ["Keywords",  post.scores.quality],
              // Engagement (always 0) deliberately omitted
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-zinc-600 w-16">{label}</span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600/70 rounded-full"
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-zinc-500 w-5 text-right">{Math.round(val)}</span>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-zinc-800/50 mt-0.5">
            <span className="text-zinc-500">Subreddit weight</span>
            <span className={finalColor}>{post.subredditWeight.toFixed(2)}×</span>
          </div>
          <div className="col-span-2 text-zinc-700 mt-0.5 text-[9px]">
            Scores estimated · real data pending OAuth approval
          </div>
        </div>
      )}
    </article>
  );
}
