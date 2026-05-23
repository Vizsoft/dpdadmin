"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DriverLiveLocation } from "@/features/locations/types";
import {
  formatBatteryLevel,
  formatDurationSince,
  formatSpeedKmh,
  driverInitials,
} from "./tracking-metrics";
import {
  fleetStatusFromLocation,
  LEGEND_STATUSES,
  TrackingStatusDot,
  TrackingStatusPill,
  type FleetStatusKey,
} from "./tracking-status";
import { TrackingGlassCard } from "./tracking-shell";
import type { LiveDriverMeta } from "./live-tracking-types";

export type MapLayerToggle = "live" | "traffic" | "heatmap" | "geofences";

export function TrackingMapToolbar({
  activeLayer,
  onLayerChange,
  geofencesEnabled,
}: {
  activeLayer: MapLayerToggle;
  onLayerChange: (layer: MapLayerToggle) => void;
  geofencesEnabled: boolean;
}) {
  const t = useTranslations("pages.liveTracking");

  const pills: { id: MapLayerToggle; label: string }[] = [
    { id: "live", label: t("mapLayerLive") },
    { id: "traffic", label: t("mapLayerTraffic") },
    { id: "heatmap", label: t("mapLayerHeatmap") },
    { id: "geofences", label: t("mapLayerGeofences") },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 rounded-full border border-border/80 bg-card/90 p-1 shadow-lg backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/90">
        {pills.map((pill) => {
          const isActive =
            pill.id === "live"
              ? activeLayer === "live"
              : pill.id === "geofences"
                ? geofencesEnabled
                : activeLayer === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                if (pill.id === "geofences") {
                  onLayerChange(geofencesEnabled ? "live" : "geofences");
                  return;
                }
                onLayerChange(pill.id);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TrackingMapLegend() {
  const t = useTranslations("pages.liveTracking");

  return (
    <TrackingGlassCard className="pointer-events-none absolute bottom-3 left-3 z-10 border-border/70 p-2.5 shadow-lg">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("mapLegend")}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
        {LEGEND_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5 text-[11px]">
            <TrackingStatusDot status={status} />
            <span>{t(`fleetStatus.${status}`)}</span>
          </li>
        ))}
      </ul>
    </TrackingGlassCard>
  );
}

export function TrackingSelectedDriverPopup({
  driver,
  meta,
  onViewDetails,
}: {
  driver: DriverLiveLocation;
  meta?: LiveDriverMeta;
  onViewDetails?: () => void;
}) {
  const t = useTranslations("pages.liveTracking");
  const fleetStatus = fleetStatusFromLocation({
    pinStatus: driver.pinStatus,
    trackingStatus: driver.trackingStatus,
    isOnDuty: driver.isOnDuty,
  });

  return (
    <TrackingGlassCard className="pointer-events-auto absolute bottom-14 right-3 z-10 w-[min(100%,280px)] border-border/80 p-3 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {driverInitials(driver.driverName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{driver.driverName}</p>
          <p className="font-mono text-xs text-muted-foreground">#{driver.driverCode}</p>
          <div className="mt-1">
            <TrackingStatusPill
              status={fleetStatus}
              label={
                driver.isOnDuty ? t("onDuty") : t("offDuty")
              }
            />
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">{t("colBattery")}</dt>
          <dd className="font-medium">{formatBatteryLevel(driver.batteryPct)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("colSpeed")}</dt>
          <dd className="font-medium">{formatSpeedKmh(driver.speedMps)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">{t("colLastSeen")}</dt>
          <dd className="font-medium">{formatDurationSince(driver.lastSeenAt)}</dd>
        </div>
      </dl>
      {meta?.detailHref ? (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full"
          render={<Link href={meta.detailHref} />}
        >
          <Navigation className="me-1.5 h-3.5 w-3.5" />
          {t("viewDriverDetails")}
        </Button>
      ) : onViewDetails ? (
        <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={onViewDetails}>
          <MapPin className="me-1.5 h-3.5 w-3.5" />
          {t("viewDriverDetails")}
        </Button>
      ) : null}
    </TrackingGlassCard>
  );
}

export function legendStatusLabel(
  t: ReturnType<typeof useTranslations<"pages.liveTracking">>,
  status: FleetStatusKey,
): string {
  return t(`fleetStatus.${status}`);
}
