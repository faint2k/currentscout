"use client";

import React from "react";

export function HighSignalPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-xs font-semibold text-zinc-200 mb-1.5">High Signal Feed</p>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Posts that combine <strong className="text-zinc-300">technical depth</strong> with
          real engagement. Filtered for quality score ≥ 58, engagement ≥ 35, and
          final score ≥ 45. This is where the substantive discussion lives.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Quality Signals
        </p>
        <div className="space-y-1.5 text-[11px] text-zinc-500">
          <p>+ Research papers (arxiv, etc.)</p>
          <p>+ Benchmarks and experiments</p>
          <p>+ Release announcements</p>
          <p>+ Technical guides and tutorials</p>
          <p>+ Substantive comparisons</p>
          <p>+ High comment-to-score ratio</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/70 rounded-lg p-3">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
          Noise Reduction
        </p>
        <div className="space-y-1.5 text-[11px] text-zinc-500">
          <p>− Meme / humor content (−28% score)</p>
          <p>− Short titles (&lt;25 chars, −12%)</p>
          <p>− Low-effort hype posts</p>
          <p>− Fluff keywords: "lol", "bruh", etc.</p>
        </div>
      </div>
    </div>
  );
}
