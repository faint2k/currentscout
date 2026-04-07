import React from "react";

type BadgeVariant = "default" | "blue" | "green" | "yellow" | "orange" | "red" | "purple" | "zinc";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-zinc-700 text-zinc-300",
  blue:    "bg-blue-900/60 text-blue-300 border border-blue-700/40",
  green:   "bg-green-900/60 text-green-300 border border-green-700/40",
  yellow:  "bg-yellow-900/60 text-yellow-300 border border-yellow-700/40",
  orange:  "bg-orange-900/60 text-orange-300 border border-orange-700/40",
  red:     "bg-red-900/60 text-red-300 border border-red-700/40",
  purple:  "bg-violet-900/60 text-violet-300 border border-violet-700/40",
  zinc:    "bg-zinc-800 text-zinc-400 border border-zinc-700/50",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none tracking-wide uppercase ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
