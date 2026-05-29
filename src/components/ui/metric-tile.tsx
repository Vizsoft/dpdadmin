"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Semantic tones only — maps to CSS vars (success/warning/danger/primary/muted). */
export type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

const TONE_STYLES: Record<
  Tone,
  {
    tile: string;
    iconChip: string;
    softPill: string;
    solidPill: string;
    dot: string;
    signal: string;
  }
> = {
  primary: {
    tile: "border-primary/20 bg-primary/5",
    iconChip: "bg-primary/10 text-primary",
    softPill: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
    solidPill: "bg-primary text-primary-foreground",
    dot: "bg-primary",
    signal: "bg-primary",
  },
  success: {
    tile: "border-success/20 bg-success-bg",
    iconChip: "bg-success-bg text-success",
    softPill: "bg-success-bg text-success ring-1 ring-inset ring-success/20",
    solidPill: "bg-success text-white",
    dot: "bg-success",
    signal: "bg-success",
  },
  warning: {
    tile: "border-warning/20 bg-warning-bg",
    iconChip: "bg-warning-bg text-warning",
    softPill: "bg-warning-bg text-warning ring-1 ring-inset ring-warning/20",
    solidPill: "bg-warning text-foreground",
    dot: "bg-warning",
    signal: "bg-warning",
  },
  danger: {
    tile: "border-danger/20 bg-danger-bg",
    iconChip: "bg-danger-bg text-danger",
    softPill: "bg-danger-bg text-danger ring-1 ring-inset ring-danger/20",
    solidPill: "bg-danger text-white",
    dot: "bg-danger",
    signal: "bg-danger",
  },
  neutral: {
    tile: "border-border bg-muted/40",
    iconChip: "bg-muted text-muted-foreground",
    softPill: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    solidPill: "bg-muted-foreground text-background",
    dot: "bg-muted-foreground",
    signal: "bg-muted-foreground",
  },
};

/** Map legacy palette tone names to semantic tones during migration. */
export function normalizeTone(tone: string): Tone {
  switch (tone) {
    case "primary":
    case "blue":
    case "indigo":
      return "primary";
    case "success":
    case "emerald":
    case "green":
      return "success";
    case "warning":
    case "amber":
    case "orange":
    case "yellow":
      return "warning";
    case "danger":
    case "rose":
    case "red":
      return "danger";
    default:
      return "neutral";
  }
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  selected = false,
  trendPercent,
  trendDirection = "up",
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone | string;
  selected?: boolean;
  trendPercent?: string;
  trendDirection?: "up" | "down";
  hint?: string;
  className?: string;
}) {
  const resolvedTone = normalizeTone(tone);
  const toneStyle = TONE_STYLES[resolvedTone];
  const TrendIcon = trendDirection === "up" ? ArrowUp : ArrowDown;
  const trendClass =
    trendDirection === "up" ? "text-success" : "text-danger";

  return (
    <article
      className={cn(
        "rounded-xl border p-3 shadow-sm transition-colors duration-150",
        toneStyle.tile,
        selected && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg",
              toneStyle.iconChip,
            )}
            aria-hidden
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>

      {trendPercent ? (
        <p
          className={cn(
            "mt-1 inline-flex items-center gap-1 text-xs font-medium tabular-nums",
            trendClass,
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {trendPercent}
        </p>
      ) : null}

      {hint ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </article>
  );
}

export function StatusDot({
  tone = "neutral",
  className,
}: {
  tone?: Tone | string;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[normalizeTone(tone)];
  return (
    <span
      className={cn("relative inline-flex h-2.5 w-2.5 shrink-0", className)}
      aria-hidden
    >
      <span className={cn("absolute inset-0 rounded-full opacity-25", toneStyle.dot)} />
      <span
        className={cn(
          "absolute inset-[2px] rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.55)]",
          toneStyle.dot,
        )}
      />
    </span>
  );
}

export function SignalBars({
  value,
  tone = "success",
  className,
}: {
  value: 0 | 1 | 2 | 3 | 4;
  tone?: Tone | string;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[normalizeTone(tone)];
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-[2px] transition-colors duration-150",
            bar === 1 && "h-1.5",
            bar === 2 && "h-2.5",
            bar === 3 && "h-3.5",
            bar === 4 && "h-4.5",
            bar <= value ? toneStyle.signal : "bg-muted",
          )}
        />
      ))}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  variant = "soft",
  className,
}: {
  children: ReactNode;
  tone?: Tone | string;
  variant?: "soft" | "solid";
  className?: string;
}) {
  const toneStyle = TONE_STYLES[normalizeTone(tone)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        variant === "solid" ? toneStyle.solidPill : toneStyle.softPill,
        className,
      )}
    >
      {children}
    </span>
  );
}
