import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate text-sandstone border-ash",
  gold: "bg-gold/12 text-gold-bright border-gold/40",
  success: "bg-success/12 text-success border-success/40",
  warning: "bg-gold/12 text-gold border-gold/40",
  danger: "bg-danger/12 text-danger border-danger/40",
  info: "bg-nile/12 text-nile border-nile/40",
};

/** Compact metadata badge. */
export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border",
        "px-2.5 py-0.5 text-xs font-medium leading-5",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Confidence badge (spec §24).
 * The colour is never the only signal: the label text
 * states the level, keeping it readable for everyone.
 */
export function ConfidenceBadge({
  level,
  value,
  className,
}: {
  level: "high" | "medium" | "low";
  value?: number;
  className?: string;
}) {
  const tone: BadgeTone =
    level === "high"
      ? "success"
      : level === "medium"
        ? "warning"
        : "danger";
  return (
    <Badge tone={tone} className={cn("tabular-nums", className)}>
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {value !== undefined ? `${Math.round(value * 100)}%` : level}
      <span className="sr-only">
        {value !== undefined ? ` confidence ${level}` : ` ${level} confidence`}
      </span>
    </Badge>
  );
}

/** Marks demo/generated content clearly (spec §86). */
export function DemoBadge({
  label = "Demo",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      tone="warning"
      className={cn("uppercase tracking-wide", className)}
    >
      {label}
    </Badge>
  );
}