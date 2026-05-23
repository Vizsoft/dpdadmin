"use client";

import type { ReactNode } from "react";
import { MetricTile } from "@/components/ui/metric-tile";
import { cn } from "@/lib/utils";

export function TrackingGlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm transition-colors",
        "dark:border-slate-700/80 dark:bg-slate-900/90",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TrackingCommandLayout({
  left,
  center,
  right,
  className,
  fullscreen,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  className?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        fullscreen
          ? "h-full min-h-0 grid-rows-1 xl:grid-cols-[300px_minmax(0,1fr)_340px]"
          : "min-h-[560px] xl:grid-cols-[300px_minmax(0,1fr)_340px]",
        "max-xl:grid-cols-1",
        className,
      )}
    >
      <aside className="flex min-h-0 max-xl:max-h-[420px] flex-col gap-2 overflow-hidden">
        {left}
      </aside>
      <section className="flex min-h-0 min-h-[560px] flex-col gap-2 max-xl:min-h-[480px]">
        {center}
      </section>
      <aside className="flex min-h-0 flex-col gap-2 max-xl:order-last">{right}</aside>
    </div>
  );
}

export function TrackingMapFrame({
  children,
  className,
  mapHeightClass = "min-h-[560px] flex-1",
}: {
  children: ReactNode;
  className?: string;
  mapHeightClass?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl",
        "border border-border bg-muted/30 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40",
        className,
      )}
    >
      <div className={cn("relative min-h-0 flex-1", mapHeightClass)}>{children}</div>
    </div>
  );
}

export function TrackingMetricTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "success" | "warning" | "danger";
}) {
  const accentClass =
    accent === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : accent === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";

  return (
    <MetricTile
      label={label}
      value={value}
      tone={
        accent === "success"
          ? "emerald"
          : accent === "warning"
            ? "amber"
            : accent === "danger"
              ? "rose"
              : "slate"
      }
      hint={hint}
      className={cn("min-h-[90px]", accentClass)}
    />
  );
}
