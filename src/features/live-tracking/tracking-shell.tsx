"use client";

import type { ReactNode } from "react";
import { MetricTile } from "@/components/ui/metric-tile";
import { LAYOUT } from "@/components/app/layout-spacing";
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
  className,
  fullscreen,
}: {
  left: ReactNode;
  center: ReactNode;
  className?: string;
  fullscreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid",
        LAYOUT.panelGap,
        fullscreen
          ? "h-full min-h-0 grid-rows-1 xl:grid-cols-[300px_minmax(0,1fr)]"
          : "xl:grid-cols-[300px_minmax(0,1fr)]",
        "max-xl:grid-cols-1",
        className,
      )}
    >
      <aside className={cn("flex min-h-0 max-xl:max-h-[420px] flex-col overflow-hidden", LAYOUT.panelGap)}>
        {left}
      </aside>
      <section
        className={cn(
          "flex min-h-0 flex-col",
          LAYOUT.panelGap,
          fullscreen && "h-full min-h-0",
        )}
      >
        {center}
      </section>
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
        "relative flex shrink-0 flex-col overflow-hidden rounded-xl",
        "border border-border bg-muted/30 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/40",
        className,
      )}
    >
      <div className={cn("relative min-h-0", mapHeightClass)}>{children}</div>
    </div>
  );
}

/** Map capped above the fold with optional footer widgets in normal document flow. */
export function TrackingMapStage({
  children,
  footer,
  mapHeightClass,
  frameClassName,
  fullscreen,
}: {
  children: ReactNode;
  footer?: ReactNode;
  mapHeightClass?: string;
  frameClassName?: string;
  fullscreen?: boolean;
}) {
  const aboveFoldHeight = cn(LAYOUT.mapAboveFoldHeight, LAYOUT.mapAboveFoldMin);
  const resolvedMapHeight = fullscreen
    ? (mapHeightClass ?? "min-h-0 h-full flex-1")
    : footer
      ? aboveFoldHeight
      : (mapHeightClass ?? aboveFoldHeight);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        LAYOUT.panelGap,
        fullscreen && "h-full min-h-0",
      )}
    >
      <TrackingMapFrame mapHeightClass={resolvedMapHeight} className={frameClassName}>
        {children}
      </TrackingMapFrame>
      {footer ? <div className="grid shrink-0 gap-2 md:grid-cols-2">{footer}</div> : null}
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
