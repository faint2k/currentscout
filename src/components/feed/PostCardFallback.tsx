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
  active?:  boolean;
}

/** Returns a Tailwind border-left color class based on the post's final score */
function scoreStripe(score: number): string {
  if (score >= 80) return "border-l-violet-500";
  if (score >= 60) return "border-l-blue-500";
  if (score >= 40) return "border-l-zinc-600";
  return "border-l-zinc-800/40";
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
export function PostCardFallback({ post, rank, onOpen, compact = false, active = false }: PostCardFallbackProps) {
  const [scoreOpen, setScoreOpen] = useState(false);

  const domain     = displayDomain(post.url, post.is_self, post.subreddit);
  const redditLink = redditUrl(post.permalink);
  const finalColor = scoreColor(post.scores.final);
  const titleHref  = post.is_self ? redditLink : post.url;

  // Filter badges down to the reliable subset
  const safeBadges = post.badges.filter((b) => RELIABLE_BADGES.includes(b));

  return (
    <article
      data-post-active={active ? "true" : undefined}
      className={`group relative bg-zinc-900 border border-zinc-800/70 border-l-[3px] ${scoreStripe(post.scores.final)} rounded-lg hover:border-zinc-700/80 transition-all duration-150 ${active ? "ring-1 ring-violet-500/50" : ""} ${
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
            <a
              href={titleHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0"
            >
              <h2
                className={`font-medium leading-snug text-zinc-100 group-hover:text-white hover:underline transition-colors cursor-pointer ${
                  compact ? "text-sm" : "text-[13px]"
                }`}
              >
                {post.title}
              </h2>
            </a>
            <button
              onClick={(e) => { e.preventDefault(); onOpen?.(post); }}
              title="View details"
              className="opacity-0 group-hover:opacity-100 shrink-0 text-zinc-600 hover:text-zinc-300 text-[10px] px-1 py-0.5 rounded hover:bg-zinc-800 transition-all"
            >
              ···
            </button>
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

          </div>

          {/* Top comment preview */}
          {post.topComment && (
            <p className="mt-1.5 text-[11px] text-zinc-600 leading-snug line-clamp-2">
              <span className="text-zinc-700 font-medium">Top comment: </span>
              {post.topComment}
            </p>
          )}

          {/* Selftext preview — only when no topComment and post has self text */}
          {!post.topComment && post.is_self && post.selftext && post.selftext.length > 10 && (
            <p className="text-[11px] text-zinc-600 leading-snug mt-1.5 line-clamp-2">
              {post.selftext.slice(0, 130).replace(/\s+\S*$/, "") + "…"}
            </p>
          )}

          {/* Score chip */}
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
