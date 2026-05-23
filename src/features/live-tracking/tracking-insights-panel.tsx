"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, BatteryLow, Gauge, Timer } from "lucide-react";
import type { DriverLiveLocation } from "@/features/locations/types";
import { TrackingGlassCard } from "./tracking-shell";

const OVERSPEED_KMH = 80;

export function TrackingInsightsPanel({
  drivers,
}: {
  drivers: DriverLiveLocation[];
}) {
  const t = useTranslations("pages.liveTracking");

  const insights = useMemo(() => {
    const overspeed = drivers.filter(
      (d) => d.speedMps != null && d.speedMps * 3.6 > OVERSPEED_KMH,
    ).length;
    const idle = drivers.filter((d) => d.trackingStatus === "idle").length;
    const batteryLow = drivers.filter(
      (d) => d.batteryPct != null && d.batteryPct < 20,
    ).length;
    const gpsAlerts = drivers.filter((d) => d.pinStatus === "alert").length;
    const outOfZone = drivers.filter((d) => d.zoneStatus === "out_of_zone").length;

    return [
      {
        id: "delays",
        icon: Timer,
        label: t("insightDelays"),
        count: outOfZone,
        tone: "text-amber-600 dark:text-amber-400",
      },
      {
        id: "overspeed",
        icon: Gauge,
        label: t("insightOverspeed"),
        count: overspeed,
        tone: "text-rose-600 dark:text-rose-400",
      },
      {
        id: "idle",
        icon: AlertTriangle,
        label: t("insightIdle"),
        count: idle,
        tone: "text-slate-600 dark:text-slate-300",
      },
      {
        id: "battery",
        icon: BatteryLow,
        label: t("insightBattery"),
        count: batteryLow,
        tone: "text-orange-600 dark:text-orange-400",
      },
      {
        id: "gps",
        icon: AlertTriangle,
        label: t("insightGps"),
        count: gpsAlerts,
        tone: "text-rose-600 dark:text-rose-400",
      },
    ];
  }, [drivers, t]);

  return (
    <TrackingGlassCard className="p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("aiInsights")}
      </h3>
      <ul className="mt-2 space-y-2">
        {insights.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-xs transition-colors hover:bg-muted/35"
          >
            <span className="flex min-w-0 items-center gap-2">
              <item.icon className={cnIcon(item.tone)} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className={cnCount(item.count)}>{item.count}</span>
          </li>
        ))}
      </ul>
    </TrackingGlassCard>
  );
}

function cnIcon(tone: string) {
  return `h-3.5 w-3.5 shrink-0 ${tone}`;
}

function cnCount(count: number) {
  return `shrink-0 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
    count > 0 ? "text-foreground" : "text-muted-foreground"
  }`;
}
