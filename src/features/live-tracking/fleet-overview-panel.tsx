"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Clock3,
  Package,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MetricTile, Pill, type Tone } from "@/components/ui/metric-tile";
import { cn } from "@/lib/utils";
import type { DriverLiveLocation } from "@/features/locations/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveDriverList } from "./live-driver-list";
import { TrackingGlassCard } from "./tracking-shell";
import type { LiveTrackingFilterState } from "./live-tracking-filters";

export function FleetOverviewPanel({
  totalDrivers,
  trackedCount,
  inProgressCount,
  alertsCount,
  drivers,
  selectedDriverId,
  onSelectDriver,
  filters,
  onChange,
  zoneOptions,
  partnerOptions,
}: {
  totalDrivers: number;
  trackedCount: number;
  inProgressCount: number;
  alertsCount: number;
  drivers: DriverLiveLocation[];
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string) => void;
  filters: LiveTrackingFilterState;
  onChange: (next: LiveTrackingFilterState) => void;
  zoneOptions: Array<{ id: string; label: string }>;
  partnerOptions: Array<{ id: string; label: string }>;
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
    { id: "alert", label: t("chipAlert"), tone: "rose" },
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
        value: inProgressCount.toLocaleString(),
        tone: "indigo" as const,
        icon: Package,
      },
      {
        id: "delayed",
        label: t("metricDelayed"),
        value: Math.max(0, Math.round(alertsCount * 1.3)).toLocaleString(),
        tone: "amber" as const,
        icon: Clock3,
      },
      {
        id: "sos",
        label: t("metricSos"),
        value: alertsCount.toLocaleString(),
        tone: "rose" as const,
        icon: AlertTriangle,
      },
    ],
    [alertsCount, inProgressCount, t, totalDrivers, trackedCount],
  );

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-700/80">
        <div className="mt-3 grid grid-cols-2 gap-2">
          {stats.map((tile) => (
            <MetricTile
              key={tile.id}
              label={tile.label}
              value={tile.value}
              tone={tile.tone}
              icon={tile.icon}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 border-b border-slate-200 px-3 py-3 dark:border-slate-700/80">
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
                  statusChips: ["online", "on_duty", "idle", "alert", "offline"],
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
            <span className="ms-auto inline-flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t("selectedCount", { count: selectedChipCount })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Select
            items={zoneOptions.map((opt) => ({ value: opt.id, label: opt.label }))}
            value={filters.zoneId}
            onValueChange={(value) => onChange({ ...filters, zoneId: value ?? "all" })}
          >
            <SelectTrigger className="h-8 cursor-pointer rounded-lg text-xs">
              <SelectValue placeholder={t("filterZone")} />
            </SelectTrigger>
            <SelectContent>
              {zoneOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id} label={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={partnerOptions.map((opt) => ({ value: opt.id, label: opt.label }))}
            value={filters.partnerId}
            onValueChange={(value) => onChange({ ...filters, partnerId: value ?? "all" })}
          >
            <SelectTrigger className="h-8 cursor-pointer rounded-lg text-xs">
              <SelectValue placeholder={t("filterPartner")} />
            </SelectTrigger>
            <SelectContent>
              {partnerOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id} label={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: "all", label: t("filterBatteryAll") },
              { value: "low", label: t("filterBatteryLow") },
              { value: "medium", label: t("filterBatteryMedium") },
              { value: "high", label: t("filterBatteryHigh") },
            ]}
            value={filters.batteryLevel}
            onValueChange={(value) =>
              onChange({
                ...filters,
                batteryLevel: (value as LiveTrackingFilterState["batteryLevel"]) ?? "all",
              })
            }
          >
            <SelectTrigger className="h-8 cursor-pointer rounded-lg text-xs">
              <SelectValue placeholder={t("filterBattery")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label={t("filterBatteryAll")}>
                {t("filterBatteryAll")}
              </SelectItem>
              <SelectItem value="low" label={t("filterBatteryLow")}>
                {t("filterBatteryLow")}
              </SelectItem>
              <SelectItem value="medium" label={t("filterBatteryMedium")}>
                {t("filterBatteryMedium")}
              </SelectItem>
              <SelectItem value="high" label={t("filterBatteryHigh")}>
                {t("filterBatteryHigh")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            items={[
              { value: "all", label: t("filterGpsAll") },
              { value: "excellent", label: t("gpsExcellent") },
              { value: "good", label: t("gpsGood") },
              { value: "weak", label: t("gpsWeak") },
            ]}
            value={filters.gpsSignal}
            onValueChange={(value) =>
              onChange({ ...filters, gpsSignal: (value as LiveTrackingFilterState["gpsSignal"]) ?? "all" })
            }
          >
            <SelectTrigger className="h-8 cursor-pointer rounded-lg text-xs">
              <SelectValue placeholder={t("filterGps")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label={t("filterGpsAll")}>
                {t("filterGpsAll")}
              </SelectItem>
              <SelectItem value="excellent" label={t("gpsExcellent")}>
                {t("gpsExcellent")}
              </SelectItem>
              <SelectItem value="good" label={t("gpsGood")}>
                {t("gpsGood")}
              </SelectItem>
              <SelectItem value="weak" label={t("gpsWeak")}>
                {t("gpsWeak")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="border-b border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            {t("trackedCount", { count: drivers.length })}
          </div>
          <LiveDriverList drivers={drivers} selectedId={selectedDriverId} onSelect={onSelectDriver} />
        </div>
      </div>
    </TrackingGlassCard>
  );
}
