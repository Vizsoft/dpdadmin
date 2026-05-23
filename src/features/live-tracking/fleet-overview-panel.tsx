"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ChevronDown,
  Clock3,
  Package,
  Search,
  Settings2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricTile, Pill, type Tone } from "@/components/ui/metric-tile";
import { cn } from "@/lib/utils";
import { TrackingGlassCard } from "./tracking-shell";
import type { LiveTrackingFilterState } from "./live-tracking-filters";

export function FleetOverviewPanel({
  totalDrivers,
  trackedCount,
  alertsCount,
  filters,
  onChange,
}: {
  totalDrivers: number;
  trackedCount: number;
  alertsCount: number;
  filters: LiveTrackingFilterState;
  onChange: (next: LiveTrackingFilterState) => void;
}) {
  const t = useTranslations("pages.liveTracking");

  const statusChips: Array<{
    id: LiveTrackingFilterState["statusChips"][number];
    label: string;
    tone: Tone;
  }> = [
    { id: "online", label: t("chipOnline"), tone: "emerald" },
    { id: "on_duty", label: t("chipOnDuty"), tone: "blue" },
    { id: "idle", label: t("chipIdle"), tone: "amber" },
    { id: "break", label: t("chipBreak"), tone: "indigo" },
    { id: "offline", label: t("chipOffline"), tone: "slate" },
  ];

  const selectedChipCount = filters.statusChips.length;

  const stats = useMemo(
    () => [
      {
        id: "total",
        label: t("metricTotalDrivers"),
        value: totalDrivers.toLocaleString(),
        tone: "blue" as const,
        icon: Users,
        trend: "+8.2%",
      },
      {
        id: "active",
        label: t("metricActiveTracked"),
        value: trackedCount.toLocaleString(),
        tone: "emerald" as const,
        icon: UserCheck,
        trend: "+7.1%",
      },
      {
        id: "progress",
        label: t("metricInProgress"),
        value: trackedCount.toLocaleString(),
        tone: "indigo" as const,
        icon: Package,
        trend: "+12.4%",
        selected: true,
      },
      {
        id: "delayed",
        label: t("metricDelayed"),
        value: Math.max(0, Math.round(alertsCount * 1.3)).toLocaleString(),
        tone: "amber" as const,
        icon: Clock3,
        trend: "+5.3%",
      },
      {
        id: "sos",
        label: t("metricSos"),
        value: alertsCount.toLocaleString(),
        tone: "rose" as const,
        icon: AlertTriangle,
        trend: "-12.5%",
        trendDirection: "down" as const,
      },
    ],
    [alertsCount, t, totalDrivers, trackedCount],
  );

  const filterRows = [
    { label: t("filterVehicleType"), value: t("allStatuses") },
    { label: t("filterZone"), value: t("allZones") },
    { label: t("filterBattery"), value: t("filterBatteryAll") },
    { label: t("filterSpeedAlerts"), value: t("allStatuses") },
    { label: t("filterGps"), value: t("filterGpsAll") },
  ];

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-700/80">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("fleetOverview")}
          </h2>
          <button
            type="button"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((tile) => (
            <MetricTile
              key={tile.id}
              label={tile.label}
              value={tile.value}
              tone={tile.tone}
              icon={tile.icon}
              selected={Boolean(tile.selected)}
              trendPercent={tile.trend}
              trendDirection={tile.trendDirection}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="h-9 rounded-lg border-slate-200 bg-slate-50 ps-8 text-sm shadow-none transition-colors focus-visible:bg-white dark:border-slate-700 dark:bg-slate-900"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-slate-700/70 dark:bg-slate-900/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t("filters")}
            </p>
            <button
              type="button"
              className="cursor-pointer text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
              onClick={() =>
                onChange({
                  ...filters,
                  statusChips: ["online", "on_duty", "idle", "break", "offline"],
                  search: "",
                  zoneId: "all",
                  partnerId: "all",
                  trackingStatus: "all",
                  batteryLevel: "all",
                  gpsSignal: "all",
                })
              }
            >
              {t("reset")}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  const exists = filters.statusChips.includes(chip.id);
                  onChange({
                    ...filters,
                    statusChips: exists
                      ? filters.statusChips.filter((id) => id !== chip.id)
                      : [...filters.statusChips, chip.id],
                  });
                }}
                className="cursor-pointer"
              >
                <Pill
                  tone={chip.tone}
                  className={cn(
                    "px-2.5 py-1 text-[11px]",
                    filters.statusChips.includes(chip.id)
                      ? ""
                      : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-700",
                  )}
                >
                  {chip.label}
                </Pill>
              </button>
            ))}
            <button
              type="button"
              className="ms-auto inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t("selectedCount", { count: selectedChipCount })}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          {filterRows.map((row) => (
            <button
              key={row.label}
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span>{row.label}</span>
              <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                {row.value}
                <ChevronDown className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {t("moreFilters")}
          <ChevronDown className="ms-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </TrackingGlassCard>
  );
}
