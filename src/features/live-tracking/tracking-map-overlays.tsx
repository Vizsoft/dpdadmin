"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Expand,
  Layers2,
  LocateFixed,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { Pill, SignalBars, StatusDot } from "@/components/ui/metric-tile";
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

  const mapPills: Array<{ id: "live" | "traffic" | "heatmap"; label: string }> = [
    { id: "live", label: t("mapLayerLive") },
    { id: "traffic", label: t("mapLayerTraffic") },
    { id: "heatmap", label: t("mapLayerHeatmap") },
  ];

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between p-3">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          {mapPills.map((pill) => {
            const isActive = activeLayer === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onLayerChange(pill.id)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onLayerChange(geofencesEnabled ? "live" : "geofences")}
          className={cn(
            "pointer-events-auto inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors",
            geofencesEnabled
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
              : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800",
          )}
        >
          <Layers2 className="h-3.5 w-3.5" />
          {t("mapLayerGeofences")}
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-14 left-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          title={t("recenter")}
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          title={t("layers")}
        >
          <Layers2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="pointer-events-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          title={t("fullscreen")}
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export function TrackingMapLegend() {
  const t = useTranslations("pages.liveTracking");

  const toneByStatus: Record<FleetStatusKey, "emerald" | "blue" | "amber" | "indigo" | "slate" | "rose"> =
    {
      available: "emerald",
      delivering: "blue",
      idle: "amber",
      break: "indigo",
      offline: "slate",
      alert: "rose",
      cluster: "blue",
    };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
      <TrackingGlassCard className="pointer-events-auto w-full max-w-3xl rounded-xl border-slate-200 bg-white/95 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LEGEND_STATUSES.map((status) => (
            <li key={status} className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
              <StatusDot tone={toneByStatus[status]} />
              <span>{t(`fleetStatus.${status}`)}</span>
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
              12
            </span>
            <span>{t("fleetStatus.cluster")}</span>
          </li>
        </ul>
      </TrackingGlassCard>
    </div>
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
  const speed = formatSpeedKmh(driver.speedMps);

  const toneByStatus: Record<FleetStatusKey, "emerald" | "blue" | "amber" | "indigo" | "slate" | "rose"> =
    {
      available: "emerald",
      delivering: "blue",
      idle: "amber",
      break: "indigo",
      offline: "slate",
      alert: "rose",
      cluster: "blue",
    };

  return (
    <TrackingGlassCard className="pointer-events-auto absolute left-1/2 top-1/2 z-20 w-[360px] max-w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border-slate-200 bg-white/98 p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900/96">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
          {driverInitials(driver.driverName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {driver.driverName}
            </p>
            <Pill tone={driver.isOnDuty ? "emerald" : "slate"} variant="solid">
              {driver.isOnDuty ? t("onDuty") : t("offDuty")}
            </Pill>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
            {driver.driverCode} <span className="mx-1">·</span> {speed}
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-1.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800/60">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-300">{t("colBattery")}</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">
            {formatBatteryLevel(driver.batteryPct)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-300">{t("colLastSeen")}</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">
            {formatDurationSince(driver.lastSeenAt)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-300">{t("activeOrders")}</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">2</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-slate-500 dark:text-slate-300">{t("eta")}</dt>
          <dd className="font-semibold text-slate-900 dark:text-slate-100">20 min</dd>
        </div>
      </dl>

      <p className="mt-2 truncate text-[11px] text-slate-500 dark:text-slate-300">
        MG Road, Sector 28, Gurugram
      </p>

      <div className="mt-3 grid grid-cols-4 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
        <OverlayAction
          label={t("viewDetails")}
          icon={Navigation}
          href={meta?.detailHref ?? undefined}
          onClick={onViewDetails}
        />
        <OverlayAction label={t("call")} icon={Phone} href={meta?.phone ? `tel:${meta.phone}` : undefined} />
        <OverlayAction label={t("message")} icon={Mail} />
        <OverlayAction label={t("assignOrder")} icon={MapPin} />
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
        <StatusDot tone={toneByStatus[fleetStatus]} />
        <span>{t(`fleetStatus.${fleetStatus}`)}</span>
        <span className="mx-1">•</span>
        <span>{t("gpsQualityLevel.excellent")}</span>
        <SignalBars value={4} />
      </div>
    </TrackingGlassCard>
  );
}

function OverlayAction({
  label,
  icon: Icon,
  href,
  onClick,
}: {
  label: string;
  icon: typeof MapPin;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <span className="inline-flex w-full flex-col items-center gap-1 px-1 py-2 text-[10px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-center leading-tight">{label}</span>
    </span>
  );

  if (href) {
    if (href.startsWith("tel:")) {
      return (
        <a href={href} className="cursor-pointer">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="cursor-pointer">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="cursor-pointer">
      {content}
    </button>
  );
}

export function legendStatusLabel(
  t: ReturnType<typeof useTranslations<"pages.liveTracking">>,
  status: FleetStatusKey,
): string {
  return t(`fleetStatus.${status}`);
}
