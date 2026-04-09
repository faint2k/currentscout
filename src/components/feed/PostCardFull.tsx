"use client";

import React, { useState } from "react";
import { SubredditChip } from "../ui/SubredditChip";
import { TrendBadgeList } from "../ui/TrendBadge";
import { timeAgo, formatNum, redditUrl, displayDomain, scoreColor } from "../../lib/utils/format";
import type { RankedPost } from "../../lib/reddit/types";

interface PostCardFullProps {
  post:     RankedPost;
  rank?:    number;
  onOpen?:  (post: RankedPost) => void;
  compact?: boolean;
}

/** PostCard for posts with real data — Reddit OAuth API or Hacker News */
export function PostCardFull({ post, rank, onOpen, compact = false }: PostCardFullProps) {
  const [scoreOpen, setScoreOpen] = useState(false);

  const domain     = displayDomain(post.url, post.is_self, post.subreddit);
  const redditLink = redditUrl(post.permalink);
  const finalColor = scoreColor(post.scores.final);
  const isHN       = post.dataSource === "hn";

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
            {isHN && (
              <span
                className="shrink-0 mt-0.5 text-[9px] font-bold px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 leading-none"
                title="Hacker News"
              >
                HN
              </span>
            )}
            <h2
              className={`flex-1 min-w-0 font-medium leading-snug text-zinc-100 group-hover:text-white transition-colors cursor-pointer ${
                compact ? "text-sm" : "text-[13px]"
              }`}
              onClick={() => onOpen?.(post)}
            >
              {post.title}
            </h2>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
            <SubredditChip name={post.subreddit} />

            <span className="text-zinc-600">·</span>

            <a
              href={redditLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
              title={`${post.score} ${isHN ? "points" : "upvotes"}`}
            >
              <span className="text-zinc-400">▲</span>
              <span className="text-zinc-300 font-medium">{formatNum(post.score)}</span>
            </a>

            <a
              href={redditLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
              title={`${post.num_comments} comments`}
            >
              <span>💬</span>
              <span>{formatNum(post.num_comments)}</span>
            </a>

            {!isHN && (
              <span title="Upvote ratio">
                {Math.round(post.upvote_ratio * 100)}%
              </span>
            )}

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

          {/* Badges + weighted score */}
          {!compact && (
            <div className="flex items-center gap-2 mt-2">
              <TrendBadgeList badges={post.badges} max={3} />

              <button
                onClick={() => setScoreOpen((v) => !v)}
                className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border border-zinc-700/50 bg-zinc-800/60 ${finalColor} hover:border-zinc-600/70 transition-colors shrink-0`}
                title="Weighted trend score — click to see breakdown"
              >
                {Math.round(post.scores.final)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline score breakdown */}
      {scoreOpen && (
        <div className="mt-2 pt-2 border-t border-zinc-800/60 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          {(
            [
              ["Momentum",   post.scores.momentum],
              ["Recency",    post.scores.recency],
              ["Engagement", post.scores.engagement],
              ["Quality",    post.scores.quality],
            ] as [string, number][]
          ).map(([label, val]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-zinc-600 w-16">{label}</span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full"
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-zinc-500 w-5 text-right">{Math.round(val)}</span>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-between pt-1 border-t border-zinc-800/50 mt-0.5">
            <span className="text-zinc-500">
              {isHN ? "Source weight" : "Subreddit weight"}
            </span>
            <span className={finalColor}>{post.subredditWeight.toFixed(2)}×</span>
          </div>
        </div>
      )}
    </article>
  );
}
