"use client";

import React, { useState } from "react";
import { SubredditChip } from "../ui/SubredditChip";
import { timeAgo, redditUrl, displayDomain, scoreColor } from "../../lib/utils/format";
import type { RankedPost } from "../../lib/reddit/types";

interface PostCardFallbackProps {
  post: RankedPost;
  rank?: number;
  onOpen?: (post: RankedPost) => void;
  compact?: boolean;
  active?: boolean;
}

function scoreStripe(score: number): string {
  if (score >= 80) return "border-l-violet-500";
  if (score >= 60) return "border-l-blue-500";
  if (score >= 40) return "border-l-zinc-500";
  return "border-l-zinc-800/40";
}

export function PostCardFallback({ post, rank, onOpen, compact = false, active = false }: PostCardFallbackProps) {
  const [scoreOpen, setScoreOpen] = useState(false);

  const domain = displayDomain(post.url, post.is_self, post.subreddit);
  const redditLink = redditUrl(post.permalink);
  const finalColor = scoreColor(post.scores.final);
  const titleHref = post.is_self ? redditLink : post.url;

  return (
    <article
      data-post-active={active ? "true" : undefined}
      className={`group relative rounded-xl border border-zinc-800/80 border-l-[3px] bg-zinc-900/80 ${scoreStripe(post.scores.final)} transition-all duration-150 hover:border-zinc-700/90 hover:bg-zinc-900 ${active ? "ring-1 ring-violet-500/50" : ""} ${
        compact ? "px-3 py-2.5" : "px-4 py-3.5"
      }`}
    >
      <div className="flex gap-3">
        {rank !== undefined && (
          <div className="flex shrink-0 flex-col items-center pt-0.5">
            <span className="w-6 text-center font-mono text-[11px] leading-none text-zinc-500">{rank}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start gap-2">
            <a href={titleHref} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
              <h2
                className={`leading-snug text-zinc-100 transition-colors group-hover:text-white group-hover:underline ${
                  compact ? "text-sm font-medium" : "text-[15px] font-semibold"
                }`}
              >
                {post.title}
              </h2>
            </a>
            <button
              onClick={(e) => {
                e.preventDefault();
                onOpen?.(post);
              }}
              title="View details"
              className="shrink-0 rounded-md px-1.5 py-1 text-[10px] text-zinc-500 opacity-100 transition-all hover:bg-zinc-800 hover:text-zinc-200 sm:opacity-0 sm:group-hover:opacity-100"
            >
              ···
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
            <SubredditChip name={post.subreddit} />
            <span className="text-zinc-600">·</span>
            <span title={`Posted ${post.hoursOld.toFixed(1)}h ago`} className="text-zinc-400">
              {timeAgo(post.created_utc)}
            </span>

            {!post.is_self && (
              <>
                <span className="text-zinc-600">·</span>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[140px] truncate text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {domain} ↗
                </a>
              </>
            )}

            {post.link_flair_text && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-[10px] italic text-zinc-500">{post.link_flair_text}</span>
              </>
            )}
          </div>

          {post.topComment && (
            <p className="mt-2 text-[11px] leading-snug text-zinc-500 line-clamp-2">
              <span className="font-medium text-zinc-400">Top comment:</span> {post.topComment}
            </p>
          )}

          {!post.topComment && post.is_self && post.selftext && post.selftext.length > 10 && (
            <p className="mt-2 text-[11px] leading-snug text-zinc-500 line-clamp-2">
              {post.selftext.slice(0, 130).replace(/\s+\S*$/, "") + "…"}
            </p>
          )}

          {!compact && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/70 pt-2">
              <p className="text-[11px] text-zinc-500">
                Estimated rank signal while Reddit API access is pending.
              </p>
              <button
                onClick={() => setScoreOpen((v) => !v)}
                className={`shrink-0 rounded-lg border border-zinc-700/60 bg-zinc-800/70 px-2 py-1 font-mono text-[11px] transition-colors hover:border-zinc-500/70 ${finalColor}`}
                title="Estimated signal score based on feed position, freshness, title quality, and community weight."
              >
                ~{Math.round(post.scores.final)}
              </button>
            </div>
          )}
        </div>
      </div>

      {scoreOpen && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-zinc-800/70 bg-zinc-950/70 p-3 text-[10px]">
          {([
            ["Position", post.scores.momentum],
            ["Freshness", post.scores.recency],
            ["Keywords", post.scores.quality],
          ] as [string, number][]).map(([label, val]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-16 text-zinc-500">{label}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-violet-500/70" style={{ width: `${val}%` }} />
              </div>
              <span className="w-6 text-right text-zinc-400">{Math.round(val)}</span>
            </div>
          ))}
          <div className="col-span-2 mt-1 flex items-center justify-between border-t border-zinc-800/70 pt-2">
            <span className="text-zinc-500">Subreddit weight</span>
            <span className={finalColor}>{post.subredditWeight.toFixed(2)}×</span>
          </div>
          <div className="col-span-2 text-[9px] text-zinc-600">
            Estimate only · raw Reddit upvote/comment data will improve this once OAuth access is approved.
          </div>
        </div>
      )}
    </article>
  );
}
