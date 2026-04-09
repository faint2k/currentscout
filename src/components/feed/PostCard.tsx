"use client";

/**
 * PostCard — thin router
 *
 * Routes to the correct card implementation based on data provenance:
 *   "rss" → PostCardFallback  (estimated scores, no fake engagement metrics)
 *   "hn"  → PostCardFull      (real HN points + comments, HN badge)
 *   "api" → PostCardFull      (real Reddit OAuth data)
 *
 * Never import PostCardFallback or PostCardFull directly — always use this.
 */

import React from "react";
import { PostCardFull }     from "./PostCardFull";
import { PostCardFallback } from "./PostCardFallback";
import type { RankedPost }  from "../../lib/reddit/types";

interface PostCardProps {
  post:     RankedPost;
  rank?:    number;
  onOpen?:  (post: RankedPost) => void;
  compact?: boolean;
}

export function PostCard({ post, rank, onOpen, compact }: PostCardProps) {
  if (post.dataSource === "rss") {
    return (
      <PostCardFallback
        post={post}
        rank={rank}
        onOpen={onOpen}
        compact={compact}
      />
    );
  }

  return (
    <PostCardFull
      post={post}
      rank={rank}
      onOpen={onOpen}
      compact={compact}
    />
  );
}
