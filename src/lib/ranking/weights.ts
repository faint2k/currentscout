// ─────────────────────────────────────────────────────────────────────────────
// Ranking weight constants
// Inspired by last30days-skill's three-dimensional scoring:
//   Engagement · Recency · Relevance/Momentum
// ─────────────────────────────────────────────────────────────────────────────

/** Component weights — must sum to 1.0 */
export const SCORE_WEIGHTS = {
  /** Velocity: log-normalised upvotes-per-hour. Trend signal comes first. */
  momentum:   0.35,
  /** Freshness: linear decay over RECENCY_WINDOW_HOURS */
  recency:    0.25,
  /** Depth: logarithmic combo of score + comments + upvote ratio */
  engagement: 0.30,
  /** Quality: heuristic content-quality signals */
  quality:    0.10,
} as const;

/** Post older than this contributes 0 recency score (7 days) */
export const RECENCY_WINDOW_HOURS = 168;

/** Momentum normaliser — the "max expected" velocity in upvotes/hour.
 *  Posts approaching this value score ~100 on momentum. */
export const MOMENTUM_NORMALISER = 2_000;

/** Engagement normaliser — log1p of a "perfect" engagement signal. */
export const ENGAGEMENT_NORMALISER =
  0.50 * Math.log1p(50_000) + 0.35 * Math.log1p(5_000) + 0.15 * 10;

/** Engagement sub-weights (must sum to 1.0) */
export const ENGAGEMENT_WEIGHTS = {
  score:       0.50, // upvotes / karma
  comments:    0.35,
  upvoteRatio: 0.15, // 0–1 → scaled to 0–10 before application
} as const;

// ─── Penalty factors ──────────────────────────────────────────────────────────

/** Keywords that lower the quality score (meme/hype noise) */
export const FLUFF_KEYWORDS = [
  "meme", "lol", "lmao", "xd", "funny", "cursed", "shitpost",
  "bruh", "vibes", "based", "ratio", "no way", "bro", "omg",
  "unpopular opinion", "hot take", "rant",
];

/** Penalty multiplier when fluff is detected */
export const FLUFF_PENALTY = 0.72;

/** Penalty for very short titles (< 25 chars) */
export const SHORT_TITLE_PENALTY = 0.88;

/** Threshold for short title penalty */
export const SHORT_TITLE_THRESHOLD = 25;

// ─── Quality bonus keywords ───────────────────────────────────────────────────

/** Keywords that boost the quality score (technical, substantive content) */
export const TECHNICAL_KEYWORDS = [
  "benchmark", "performance", "latency", "throughput", "tokens/s",
  "release", "paper", "research", "arxiv", "experiment",
  "comparison", "vs ", " vs", "finetune", "fine-tune", "training",
  "inference", "quantiz", "gguf", "ggml", "quant",
  "guide", "tutorial", "how to", "howto", "step-by-step",
  "open source", "open-source", "pr ", "pull request",
  "context window", "context length", "rag", "embeddings",
  "agent", "tool use", "function call", "api", "sdk",
  "model weights", "model release", "parameter", "architecture",
  "speed", "memory", "vram", "gpu", "cpu", "m1", "m2", "m3", "m4",
];

/** Bonus per matching technical keyword (additive, up to cap) */
export const TECHNICAL_KEYWORD_BONUS = 8;
export const TECHNICAL_KEYWORD_CAP   = 40;

// ─── Signal badge thresholds ──────────────────────────────────────────────────

export const BADGE_THRESHOLDS = {
  trending:             72,   // momentum ≥ 72 → "Trending"
  hot:                  68,   // engagement ≥ 68 → "Hot"
  rising:               58,   // recency ≥ 80 AND momentum ≥ 45 → "Rising"
  deepDive:             0.06, // comments/score ratio ≥ 0.06 → "Deep Dive"
  // High Signal requires strength across all three dimensions
  highSignalMomentum:   60,
  highSignalEngagement: 55,
  highSignalQuality:    58,
} as const;
