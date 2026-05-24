"use client";

import { Gauge, MapPinned, PauseCircle, Route, Timer, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { MetricTile } from "@/components/ui/metric-tile";
import { haversineMeters } from "@/features/locations/location-status";
import type { DriverLocationEvent } from "@/features/locations/types";

export type HistorySummary = {
  totalDistanceKm: number | null;
  durationMins: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  stops: number | null;
  deliveries: number | null;
};

export function computeHistorySummary(events: DriverLocationEvent[]): HistorySummary {
  if (events.length === 0) {
    return {
      totalDistanceKm: null,
      durationMins: null,
      avgSpeedKmh: null,
      maxSpeedKmh: null,
      stops: null,
      deliveries: null,
    };
  }

  const sorted = [...events].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  let totalMeters = 0;
  let maxSpeedMps = 0;
  let deliveries = 0;
  let stops = 0;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    totalMeters += haversineMeters(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }

  for (const event of sorted) {
    if (event.trackingStatus === "delivery_submit") deliveries += 1;
    if (event.speedMps != null) maxSpeedMps = Math.max(maxSpeedMps, event.speedMps);
  }

  let idleStart: DriverLocationEvent | null = null;
  for (const event of sorted) {
    if (event.trackingStatus === "idle") {
      if (!idleStart) idleStart = event;
      continue;
    }
    if (idleStart) {
      const idleMins = (new Date(event.recordedAt).getTime() - new Date(idleStart.recordedAt).getTime()) / 60000;
      if (idleMins >= 5) stops += 1;
      idleStart = null;
    }
  }
  if (idleStart) {
    const last = sorted[sorted.length - 1]!;
    const idleMins = (new Date(last.recordedAt).getTime() - new Date(idleStart.recordedAt).getTime()) / 60000;
    if (idleMins >= 5) stops += 1;
  }

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const durationMins = Math.max(
    0,
    Math.round((new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) / 60000),
  );
  const totalDistanceKm = totalMeters / 1000;
  const avgSpeedKmh = durationMins > 0 ? totalDistanceKm / (durationMins / 60) : 0;

  return {
    totalDistanceKm,
    durationMins,
    avgSpeedKmh,
    maxSpeedKmh: maxSpeedMps * 3.6,
    stops,
    deliveries,
  };
}

export function HistorySummaryKpis({
  summary,
  loading = false,
}: {
  summary: HistorySummary;
  loading?: boolean;
}) {
  const t = useTranslations("pages.liveTracking");

  const valueOrDash = (value: number | null, formatter: (n: number) => string) =>
    value == null ? "—" : formatter(value);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <MetricTile
        label={t("historyTotalDistance")}
        value={loading ? "..." : valueOrDash(summary.totalDistanceKm, (n) => `${n.toFixed(1)} km`)}
        icon={Route}
        tone="blue"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
      <MetricTile
        label={t("historyDuration")}
        value={loading ? "..." : valueOrDash(summary.durationMins, (n) => `${n} min`)}
        icon={Timer}
        tone="indigo"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
      <MetricTile
        label={t("historyAvgSpeed")}
        value={loading ? "..." : valueOrDash(summary.avgSpeedKmh, (n) => `${n.toFixed(1)} km/h`)}
        icon={Gauge}
        tone="emerald"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
      <MetricTile
        label={t("historyMaxSpeed")}
        value={loading ? "..." : valueOrDash(summary.maxSpeedKmh, (n) => `${n.toFixed(1)} km/h`)}
        icon={MapPinned}
        tone="amber"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
      <MetricTile
        label={t("historyStops")}
        value={loading ? "..." : valueOrDash(summary.stops, (n) => `${n}`)}
        icon={PauseCircle}
        tone="slate"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
      <MetricTile
        label={t("historyDeliveries")}
        value={loading ? "..." : valueOrDash(summary.deliveries, (n) => `${n}`)}
        icon={Truck}
        tone="rose"
        className="min-h-[72px] p-2.5 [&_p:first-child]:text-[10px] [&_p:last-child]:text-sm"
      />
    </div>
  );
}
