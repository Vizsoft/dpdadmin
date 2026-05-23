"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "blue" | "emerald" | "amber" | "rose" | "indigo" | "slate";

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
  blue: {
    tile: "border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10",
    iconChip:
      "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    softPill:
      "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/25",
    solidPill: "bg-blue-600 text-white",
    dot: "bg-blue-500",
    signal: "bg-blue-500",
  },
  emerald: {
    tile: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    iconChip:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
    softPill:
      "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25",
    solidPill: "bg-emerald-600 text-white",
    dot: "bg-emerald-500",
    signal: "bg-emerald-500",
  },
  amber: {
    tile: "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10",
    iconChip:
      "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
    softPill:
      "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25",
    solidPill: "bg-amber-500 text-white",
    dot: "bg-amber-500",
    signal: "bg-amber-500",
  },
  rose: {
    tile: "border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10",
    iconChip:
      "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
    softPill:
      "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/25",
    solidPill: "bg-rose-600 text-white",
    dot: "bg-rose-500",
    signal: "bg-rose-500",
  },
  indigo: {
    tile: "border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10",
    iconChip:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
    softPill:
      "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/25",
    solidPill: "bg-indigo-600 text-white",
    dot: "bg-indigo-500",
    signal: "bg-indigo-500",
  },
  slate: {
    tile: "border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10",
    iconChip:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
    softPill:
      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/25",
    solidPill: "bg-slate-700 text-white dark:bg-slate-600",
    dot: "bg-slate-400",
    signal: "bg-slate-500",
  },
};

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "slate",
  selected = false,
  trendPercent,
  trendDirection = "up",
  hint,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: Tone;
  selected?: boolean;
  trendPercent?: string;
  trendDirection?: "up" | "down";
  hint?: string;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  const TrendIcon = trendDirection === "up" ? ArrowUp : ArrowDown;
  const trendClass =
    trendDirection === "up"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";

  return (
    <article
      className={cn(
        "rounded-xl border p-3 shadow-sm transition-colors",
        toneStyle.tile,
        selected &&
          "ring-2 ring-blue-500/70 ring-offset-1 ring-offset-background dark:ring-blue-400/60",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
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

      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
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
        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">{hint}</p>
      ) : null}
    </article>
  );
}

export function StatusDot({
  tone = "slate",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
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
  tone = "emerald",
  className,
}: {
  value: 0 | 1 | 2 | 3 | 4;
  tone?: Tone;
  className?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <span className={cn("inline-flex items-end gap-0.5", className)} aria-hidden>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-[2px] transition-colors",
            bar === 1 && "h-1.5",
            bar === 2 && "h-2.5",
            bar === 3 && "h-3.5",
            bar === 4 && "h-4.5",
            bar <= value ? toneStyle.signal : "bg-slate-200 dark:bg-slate-700",
          )}
        />
      ))}
    </span>
  );
}

export function Pill({
  children,
  tone = "slate",
  variant = "soft",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  variant?: "soft" | "solid";
  className?: string;
}) {
  const toneStyle = TONE_STYLES[tone];
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
