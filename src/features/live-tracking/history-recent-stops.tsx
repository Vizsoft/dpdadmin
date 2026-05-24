"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { DriverLocationEvent } from "@/features/locations/types";
import { Pill } from "@/components/ui/metric-tile";
import { cn } from "@/lib/utils";

type HistoryStop = {
  id: string;
  type: "idle" | "delivery" | "moving";
  startIndex: number;
  startAt: string;
  endAt: string;
  title: string;
};

export function HistoryRecentStops({
  events,
  selectedIndex,
  onSelectIndex,
  formatTime,
}: {
  events: DriverLocationEvent[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  formatTime: (iso: string) => string;
}) {
  const t = useTranslations("pages.liveTracking");
  const stops = useMemo(() => buildStops(events), [events]);

  if (stops.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        {t("historyNoStops")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("historyRecentStops")}
      </h4>
      <div className="max-h-[min(280px,35vh)] space-y-1.5 overflow-y-auto pe-1">
        {stops.map((stop) => (
          <button
            key={stop.id}
            type="button"
            className={cn(
              "w-full cursor-pointer rounded-lg border px-2.5 py-2 text-left transition-colors",
              selectedIndex === stop.startIndex
                ? "border-emerald-300 bg-emerald-50/60"
                : "border-border bg-background/80 hover:bg-muted/40",
            )}
            onClick={() => onSelectIndex(stop.startIndex)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-foreground">{stop.title}</p>
              <Pill tone={stop.type === "delivery" ? "blue" : stop.type === "idle" ? "slate" : "emerald"}>
                {stop.type === "delivery" ? "Delivery" : stop.type === "idle" ? "Idle" : "Moving"}
              </Pill>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatTime(stop.startAt)} - {formatTime(stop.endAt)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function buildStops(events: DriverLocationEvent[]): HistoryStop[] {
  const sorted = [...events].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const result: HistoryStop[] = [];

  let idleStartIndex = -1;
  let idleStart: DriverLocationEvent | null = null;
  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i]!;
    if (event.trackingStatus === "delivery_submit") {
      result.push({
        id: `delivery-${event.id}`,
        type: "delivery",
        startIndex: i,
        startAt: event.recordedAt,
        endAt: event.recordedAt,
        title: "Delivery submitted",
      });
    }

    if (event.trackingStatus === "idle") {
      if (!idleStart) {
        idleStart = event;
        idleStartIndex = i;
      }
      continue;
    }

    if (idleStart) {
      const minutes = (new Date(event.recordedAt).getTime() - new Date(idleStart.recordedAt).getTime()) / 60000;
      if (minutes >= 5) {
        result.push({
          id: `idle-${idleStart.id}`,
          type: "idle",
          startIndex: idleStartIndex,
          startAt: idleStart.recordedAt,
          endAt: event.recordedAt,
          title: "Idle stop",
        });
      }
      idleStart = null;
      idleStartIndex = -1;
    }
  }

  if (idleStart) {
    const last = sorted[sorted.length - 1]!;
    const minutes = (new Date(last.recordedAt).getTime() - new Date(idleStart.recordedAt).getTime()) / 60000;
    if (minutes >= 5) {
      result.push({
        id: `idle-${idleStart.id}`,
        type: "idle",
        startIndex: idleStartIndex,
        startAt: idleStart.recordedAt,
        endAt: last.recordedAt,
        title: "Idle stop",
      });
    }
  }

  const movingCandidates = sorted.filter((event) => event.trackingStatus === "moving");
  if (movingCandidates.length > 0) {
    const firstMoving = movingCandidates[0]!;
    result.unshift({
      id: `moving-${firstMoving.id}`,
      type: "moving",
      startIndex: sorted.findIndex((event) => event.id === firstMoving.id),
      startAt: firstMoving.recordedAt,
      endAt: firstMoving.recordedAt,
      title: "Route start",
    });
  }

  return result
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
    .slice(0, 12);
}
