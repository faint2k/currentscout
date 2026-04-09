/**
 * scorer.ts — The AI Hub trending & ranking engine
 *
 * Inspired by the last30days-skill framework:
 *   - Three-dimensional scoring: Momentum · Recency · Engagement
 *   - Logarithmic normalisation of engagement metrics (log1p)
 *   - Recency: linear decay within a rolling window
 *   - Quality heuristics layered on top
 *   - Subreddit tier weight as a final multiplier
 *
 * Formula:
 *   rawScore = 0.30*momentum + 0.20*recency + 0.40*engagement + 0.10*quality
 *   weightedScore = rawScore * subredditWeight * penaltyFactor
 */

import {
  SCORE_WEIGHTS,
  RECENCY_WINDOW_HOURS,
  MOMENTUM_NORMALISER,
  MOMENTUM_MATURITY_HOURS,
  ENGAGEMENT_NORMALISER,
  ENGAGEMENT_WEIGHTS,
  FLUFF_KEYWORDS,
  FLUFF_PENALTY,
  SHORT_TITLE_PENALTY,
  SHORT_TITLE_THRESHOLD,
  TECHNICAL_KEYWORDS,
  TECHNICAL_KEYWORD_BONUS,
  TECHNICAL_KEYWORD_CAP,
  BADGE_THRESHOLDS,
} from "./weights";
import { getSubredditWeight } from "../utils/subreddits";
import type { RankedPost, RedditPost } from "../reddit/types";

// ─── Component scoring functions ──────────────────────────────────────────────

/**
 * Momentum score (0–100)
 * Measures how fast a post is accumulating upvotes relative to its age.
 * Dampened for posts under MOMENTUM_MATURITY_HOURS — early velocity is noise.
 * A 20-min post with 80 upvotes looks like 240 upvotes/hour but hasn't
 * proven itself. Full momentum credit only after the post has had time to settle.
 */
function computeMomentum(score: number, hoursOld: number): number {
  const velocity    = score / Math.max(hoursOld, 0.25);
  const rawMomentum = Math.min(100, (Math.log1p(velocity) / Math.log1p(MOMENTUM_NORMALISER)) * 100);
  // Ramp from 0→1 over the maturity window — young posts earn momentum gradually
  const maturity    = Math.min(1, hoursOld / MOMENTUM_MATURITY_HOURS);
  return rawMomentum * maturity;
}

/**
 * Recency score (0–100)
 * Linear decay from 100 (just posted) → 0 (at RECENCY_WINDOW_HOURS).
 * Mirrors last30days temporal scoring: (1 - age/maxAge) * 100
 */
function computeRecency(hoursOld: number): number {
  return Math.max(0, (1 - hoursOld / RECENCY_WINDOW_HOURS) * 100);
}

/**
 * Engagement score (0–100)
 * Logarithmic combo identical to the Reddit formula in last30days-skill:
 *   0.50*log1p(score) + 0.35*log1p(comments) + 0.15*(ratio*10)
 * Normalised against a "perfect" engagement ceiling.
 */
function computeEngagement(
  score: number,
  numComments: number,
  upvoteRatio: number
): number {
  const raw =
    ENGAGEMENT_WEIGHTS.score       * Math.log1p(score) +
    ENGAGEMENT_WEIGHTS.comments    * Math.log1p(numComments) +
    ENGAGEMENT_WEIGHTS.upvoteRatio * (upvoteRatio * 10);
  return Math.min(100, (raw / ENGAGEMENT_NORMALISER) * 100);
}

/**
 * Quality score (0–100)
 * Heuristic content-depth signal inspired by last30days relevance scoring:
 *   - Technical keywords → additive bonus (capped)
 *   - Fluff/noise keywords → multiplicative penalty
 *   - Short title → penalty
 *   - Deep-dive: high comment-to-upvote ratio → bonus (substantive discussion)
 */
export function computeQuality(
  title: string,
  numComments: number,
  score: number,
  flair?: string | null
): number {
  const lower = (title + " " + (flair ?? "")).toLowerCase();
  let q = 50;

  // Technical depth bonuses
  let techBonus = 0;
  for (const kw of TECHNICAL_KEYWORDS) {
    if (lower.includes(kw)) {
      techBonus += TECHNICAL_KEYWORD_BONUS;
      if (techBonus >= TECHNICAL_KEYWORD_CAP) break;
    }
  }
  q += Math.min(techBonus, TECHNICAL_KEYWORD_CAP);

  // Fluff penalty
  let hasFluff = false;
  for (const kw of FLUFF_KEYWORDS) {
    if (lower.includes(kw)) { hasFluff = true; break; }
  }
  if (hasFluff) q = q * FLUFF_PENALTY;

  // Short title penalty
  if (title.length < SHORT_TITLE_THRESHOLD) q *= SHORT_TITLE_PENALTY;

  // Deep discussion bonus: high comment-to-score ratio suggests substantive thread
  const discussionRatio = numComments / Math.max(score, 1);
  if (discussionRatio >= 0.08) q += 12;
  else if (discussionRatio >= 0.04) q += 6;

  return Math.max(0, Math.min(100, q));
}

// ─── Signal badge detection ───────────────────────────────────────────────────

export type SignalBadge = "Trending" | "Hot" | "Rising" | "Deep Dive" | "High Signal";

function computeBadges(
  momentumScore: number,
  recencyScore: number,
  engagementScore: number,
  qualityScore: number,
  numComments: number,
  score: number
): SignalBadge[] {
  const badges: SignalBadge[] = [];

  if (momentumScore   >= BADGE_THRESHOLDS.trending)              badges.push("Trending");
  if (engagementScore >= BADGE_THRESHOLDS.hot)                   badges.push("Hot");
  if (recencyScore    >= 80 && momentumScore >= 45)              badges.push("Rising");

  const commentRatio = numComments / Math.max(score, 1);
  if (commentRatio   >= BADGE_THRESHOLDS.deepDive)               badges.push("Deep Dive");

  // High Signal: strong across multiple dimensions — not just one spike
  if (
    momentumScore   >= BADGE_THRESHOLDS.highSignalMomentum &&
    engagementScore >= BADGE_THRESHOLDS.highSignalEngagement &&
    qualityScore    >= BADGE_THRESHOLDS.highSignalQuality
  ) badges.push("High Signal");

  return badges;
}

// ─── Main ranking function ────────────────────────────────────────────────────

export function rankPost(post: RedditPost): RankedPost {
  const now       = Date.now() / 1000; // unix seconds
  const hoursOld  = Math.max(0, (now - post.created_utc) / 3600);

  const momentum   = computeMomentum(post.score, hoursOld);
  const recency    = computeRecency(hoursOld);
  const engagement = computeEngagement(post.score, post.num_comments, post.upvote_ratio);
  const quality    = computeQuality(post.title, post.num_comments, post.score, post.link_flair_text);

  const raw =
    SCORE_WEIGHTS.momentum   * momentum   +
    SCORE_WEIGHTS.recency    * recency    +
    SCORE_WEIGHTS.engagement * engagement +
    SCORE_WEIGHTS.quality    * quality;

  const subWeight  = getSubredditWeight(post.subreddit);
  // Absolute scale: 100 = perfect score on all dimensions from a Tier 1 sub.
  // Most real posts land 40–85. No batch normalisation — the number means something.
  const finalScore = Math.min(100, raw * subWeight);

  const badges = computeBadges(
    momentum, recency, engagement, quality,
    post.num_comments, post.score
  );

  return {
    ...post,
    hoursOld,
    scores: { momentum, recency, engagement, quality, final: finalScore },
    subredditWeight: subWeight,
    badges,
    dataSource: post.source === "hn" ? "hn" : "api",
  };
}

export function rankPosts(posts: RedditPost[]): RankedPost[] {
  const ranked = posts.map(rankPost);

  return ranked.sort((a, b) => b.scores.final - a.scores.final);
}

/**
 * Filter for "High Signal" feed — posts where substantive discussion
 * and technical content outweigh raw viral momentum.
 */
export function filterHighSignal(posts: RankedPost[]): RankedPost[] {
  return posts.filter(
    (p) =>
      p.scores.quality >= 58 &&
      p.scores.engagement >= 35 &&
      p.scores.final >= 45
  );
}

/**
 * Filter for "Trending" feed — momentum-first, recency required.
 */
export function filterTrending(posts: RankedPost[]): RankedPost[] {
  return posts.filter(
    (p) =>
      p.scores.momentum >= 40 &&
      p.scores.recency  >= 30 &&
      p.scores.final    >= 40
  );
}

// ─── RSS fallback ranker ──────────────────────────────────────────────────────
//
// Used when Reddit API is unavailable and data comes from RSS feeds.
//
// What RSS actually gives us:
//   - Feed position  → encoded in post.score (scaled by subscriber count)
//   - Post age       → post.created_utc (reliable)
//   - Subreddit      → name + tier weight (reliable)
//
// What RSS does NOT give us (do not pretend otherwise):
//   - Real upvote counts  → fake position-based estimate
//   - Comment counts      → always 0, Reddit removed from RSS
//   - Upvote ratio        → hardcoded 0.90, meaningless
//
// Formula: 50% feed position signal + 35% recency + 15% subreddit tier
// Simple, honest, proportional to what we actually know.
//
// The full rankPosts() algorithm above is preserved and unchanged —
// it activates automatically once REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
// are set in env vars and the OAuth application is approved.

// Patterns that identify low-value posts even without engagement data
const FALLBACK_JUNK_PATTERNS = [
  /\beli5\b/i,              // ELI5 megathreads
  /\bweekly\b.*\bthread\b/i,
  /\bdaily\b.*\bthread\b/i,
  /\bmonday\b|\btuesday\b|\bwednesday\b|\bthursday\b|\bfriday\b/i, // day megathreads
  /in a nutshell/i,
  /years? ago/i,            // nostalgia/history posts
  /tech bros/i,
  /\bbusyb.*student/i,
];

function isFallbackJunk(title: string): boolean {
  return FALLBACK_JUNK_PATTERNS.some((p) => p.test(title));
}

export function rankPostsFallback(posts: RedditPost[]): RankedPost[] {
  const now = Date.now() / 1000;

  // Find max score in batch for relative position signal (max spread)
  const maxScore = Math.max(...posts.map((p) => p.score), 1);

  // Shorter recency window — 48h gives real spread between a 2h and 12h post
  const FALLBACK_RECENCY_WINDOW = 48;

  const scored = posts.map((post) => {
    const hoursOld = Math.max(0, (now - post.created_utc) / 3600);

    // Position signal: raw ratio against batch max — maximum spread
    const positionSignal = (post.score / maxScore) * 100;

    // Recency: 48h window gives meaningful spread across the feed
    const recency = Math.max(0, (1 - hoursOld / FALLBACK_RECENCY_WINDOW) * 100);

    // Subreddit tier weight — our most reliable quality signal
    const subWeight = getSubredditWeight(post.subreddit);

    // Junk penalty — megathreads, memes, nostalgia posts
    const junkMultiplier = isFallbackJunk(post.title) ? 0.4 : 1.0;

    // "Best" (scores.final): absolute scale based on what we actually know.
    // Normaliser 1900 calibrated so that:
    //   ChatGPT pos-2 ≈ 95   — a genuinely strong post in the biggest community
    //   StableDiffusion pos-0 ≈ 90  — top post, smaller community
    //   LocalLLaMA pos-0 ≈ 86
    //   deeplearning pos-0 ≈ 63
    //   openrouter pos-0 ≈ 28
    //   Real spread: ~20 (tiny sub, mid-feed) → 100 (top posts, massive subs).
    const bestScore = Math.min(100, (post.score / 1900) * subWeight * junkMultiplier * 100);

    // "Trending" (scores.momentum): feed position + freshness.
    // subWeight intentionally excluded — trending velocity is about speed,
    // not sub size (that's already captured in bestScore).
    // Range: 0–100 naturally; no cap needed in practice.
    const trendingScore = (0.55 * positionSignal + 0.45 * recency) * junkMultiplier;

    const badges: SignalBadge[] = [];
    if (hoursOld < 3 && positionSignal >= 70) badges.push("Rising");

    return {
      ...post,
      hoursOld,
      scores: {
        momentum:   trendingScore,  // Trending tab sorts on this
        recency,
        engagement: 0,
        // Title-based quality works without comment data — keyword bonuses/penalties
        // still fire. Comment-ratio bonus is 0 (no comments from RSS) which is honest.
        quality:    computeQuality(post.title, 0, post.score, post.link_flair_text),
        final:      bestScore,      // Best tab sorts on this
      },
      subredditWeight: subWeight,
      badges,
      dataSource: "rss" as const,
    } as RankedPost;
  });

  return scored.sort((a, b) => b.scores.final - a.scores.final);
}
