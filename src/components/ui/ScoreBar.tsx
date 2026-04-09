import React from "react";
import { scoreBarColor } from "../../lib/utils/format";

interface ScoreBarProps {
  label:    string;
  score:    number;
  maxScore?: number;
}

export function ScoreBar({ label, score, maxScore = 100 }: ScoreBarProps) {
  const pct = Math.min(100, (score / maxScore) * 100);
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="text-zinc-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarColor(score)} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-zinc-400 w-6 text-right">{Math.round(score)}</span>
    </div>
  );
}

interface ScoreBreakdownProps {
  scores: {
    momentum:   number;
    recency:    number;
    engagement: number;
    quality:    number;
    final:      number;
  };
}

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <div className="space-y-1.5 py-2">
      <ScoreBar label="Momentum"   score={scores.momentum} />
      <ScoreBar label="Recency"    score={scores.recency} />
      <ScoreBar label="Engagement" score={scores.engagement} />
      <ScoreBar label="Quality"    score={scores.quality} />
      <div className="border-t border-zinc-700/50 pt-1.5 mt-1">
        <ScoreBar label="Final"    score={scores.final} />
      </div>
    </div>
  );
}

/**
 * Honest breakdown for RSS fallback posts.
 * - Relabels inputs to reflect what they actually measure
 * - Omits Engagement (structurally 0 from RSS — would be misleading)
 */
export function ScoreBreakdownFallback({ scores }: ScoreBreakdownProps) {
  return (
    <div className="space-y-1.5 py-2">
      <ScoreBar label="Position"  score={scores.momentum} />
      <ScoreBar label="Freshness" score={scores.recency} />
      <ScoreBar label="Keywords"  score={scores.quality} />
      <div className="border-t border-zinc-700/50 pt-1.5 mt-1">
        <ScoreBar label="Signal"  score={scores.final} />
      </div>
    </div>
  );
}
