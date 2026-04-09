"use client";

import React, { useEffect } from "react";
import { TrendBadgeList } from "../ui/TrendBadge";
import { SubredditChip } from "../ui/SubredditChip";
import { ScoreBreakdown, ScoreBreakdownFallback } from "../ui/ScoreBar";
import { timeAgo, formatNum, redditUrl, displayDomain, scoreColor } from "../../lib/utils/format";
import { getSubredditConfig } from "../../lib/utils/subreddits";
import type { RankedPost } from "../../lib/reddit/types";

interface PostModalProps {
  post:    RankedPost;
  onClose: () => void;
}

export function PostModal({ post, onClose }: PostModalProps) {
  const subConfig  = getSubredditConfig(post.subreddit);
  const redditLink = redditUrl(post.permalink);
  const domain     = displayDomain(post.url, post.is_self, post.subreddit);
  const isRSS      = post.dataSource === "rss";
  const isHN       = post.dataSource === "hn";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[51] w-full max-w-xl bg-zinc-900 border-l border-zinc-700/60 overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800 px-5 py-3 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SubredditChip name={post.subreddit} />
              {isHN && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 leading-none">
                  HN
                </span>
              )}
              {isRSS && (
                <span
                  className="text-[9px] font-mono px-1 py-0.5 rounded border border-zinc-700 text-zinc-600 leading-none"
                  title="Scores estimated from RSS feed position — real upvote data unavailable"
                >
                  RSS est.
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mt-1.5 leading-snug">
              {post.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-zinc-500 hover:text-zinc-200 text-lg leading-none mt-0.5"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* Stats row — honest per source */}
          <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
            {isRSS ? (
              // RSS: no fake upvote count, no zero comments, no hardcoded ratio
              <div className="flex items-center gap-1.5 text-zinc-500 italic">
                <span>Upvote and comment counts unavailable via RSS</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-300">▲</span>
                  <span className="font-semibold text-zinc-200">{formatNum(post.score)}</span>
                  <span>{isHN ? "points" : "upvotes"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>💬</span>
                  <span className="font-semibold text-zinc-200">{formatNum(post.num_comments)}</span>
                  <span>comments</span>
                </div>
                {!isHN && (
                  <div>
                    <span className="font-semibold text-zinc-200">{Math.round(post.upvote_ratio * 100)}%</span>
                    <span className="ml-1">upvoted</span>
                  </div>
                )}
              </>
            )}
            <div>{timeAgo(post.created_utc)}</div>
          </div>

          {/* Badges — suppressed entirely for RSS */}
          {!isRSS && post.badges.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Signal
              </p>
              <TrendBadgeList badges={post.badges} max={5} />
            </div>
          )}

          {/* Score breakdown */}
          <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                {isRSS ? "Signal Score Estimate" : "Trend Score Breakdown"}
              </p>
              <span className={`text-lg font-bold font-mono ${scoreColor(post.scores.final)}`}>
                {isRSS ? "~" : ""}{Math.round(post.scores.final)}
              </span>
            </div>

            {isRSS
              ? <ScoreBreakdownFallback scores={post.scores} />
              : <ScoreBreakdown scores={post.scores} />
            }

            <div className="mt-2 pt-2 border-t border-zinc-700/40 flex justify-between text-[10px] text-zinc-500">
              <span>{isHN ? "Source weight" : `r/${post.subreddit} weight`}</span>
              <span className="text-zinc-300">{post.subredditWeight.toFixed(2)}×</span>
            </div>
            {subConfig && (
              <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
                <span>Category</span>
                <span className="text-zinc-400">{subConfig.category}</span>
              </div>
            )}
            {isRSS && (
              <p className="mt-2 text-[9px] text-zinc-700">
                Ranked by feed position × community size × freshness — real upvote data pending API access
              </p>
            )}
          </div>

          {/* Post body preview */}
          {post.is_self && post.selftext && (
            <div>
              <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
                Post Text
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                {post.selftext}
              </p>
            </div>
          )}

          {/* External link */}
          {!post.is_self && (
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3">
              <p className="text-[10px] text-zinc-600 mb-1.5">External link</p>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 break-all transition-colors"
              >
                {domain} ↗
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <a
              href={redditLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {isHN ? "Open on HN ↗" : "Open on Reddit ↗"}
            </a>
            {!post.is_self && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 text-xs font-semibold rounded-lg transition-colors"
              >
                Open Link ↗
              </a>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
