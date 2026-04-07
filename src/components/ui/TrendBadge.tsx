import React from "react";
import { Badge } from "./Badge";
import type { SignalBadge } from "../../lib/ranking/scorer";

const BADGE_CONFIG: Record<SignalBadge, { variant: "green" | "orange" | "blue" | "purple" | "yellow" | "red"; icon: string }> = {
  "Trending":    { variant: "orange",  icon: "↑" },
  "Hot":         { variant: "red",     icon: "●" },
  "Rising":      { variant: "blue",    icon: "↗" },
  "Deep Dive":   { variant: "purple",  icon: "≡" },
  "High Signal": { variant: "green",   icon: "◆" },
};

interface TrendBadgeProps {
  badge: SignalBadge;
}

export function TrendBadge({ badge }: TrendBadgeProps) {
  const { variant, icon } = BADGE_CONFIG[badge];
  return (
    <Badge variant={variant}>
      <span className="mr-0.5">{icon}</span>
      {badge}
    </Badge>
  );
}

interface TrendBadgeListProps {
  badges: SignalBadge[];
  max?: number;
}

export function TrendBadgeList({ badges, max = 3 }: TrendBadgeListProps) {
  const shown = badges.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((b) => (
        <TrendBadge key={b} badge={b} />
      ))}
    </div>
  );
}
