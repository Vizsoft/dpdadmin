"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, BatteryLow, Gauge, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <TrackingGlassCard className="border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t("aiInsights")}
        </h3>
      </div>
      <ul className="grid grid-cols-3 gap-1.5">
        {insights.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white dark:bg-slate-900">
                <item.icon className={cnIcon(item.tone)} />
              </span>
              <span className="line-clamp-2 text-[10px] leading-tight">{item.label}</span>
            </span>
            <span className={cnCount(item.count)}>
              {item.count} {t("vehicles")}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 inline-flex cursor-not-allowed items-center gap-2 text-xs font-medium text-primary/85"
        disabled
      >
        {t("viewAllInsights")}
        <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
          {t("comingSoon")}
        </Badge>
      </button>
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
