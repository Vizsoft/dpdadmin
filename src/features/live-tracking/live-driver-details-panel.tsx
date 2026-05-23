"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DriverLiveLocation } from "@/features/locations/types";
import {
  formatAccuracyMeters,
  formatBatteryLevel,
  formatDurationSince,
  formatSpeedKmh,
  formatTimestampLabel,
  driverInitials,
  gpsQualityFromAccuracy,
} from "./tracking-metrics";
import {
  fleetStatusFromLocation,
  TrackingStatusPill,
} from "./tracking-status";
import { TrackingGlassCard, TrackingMetricTile } from "./tracking-shell";
import type { LiveDriverMeta } from "./live-tracking-types";

export function LiveDriverDetailsPanel({
  driver,
  meta,
}: {
  driver: DriverLiveLocation | null;
  meta?: LiveDriverMeta;
}) {
  const t = useTranslations("pages.liveTracking");

  if (!driver) {
    return (
    <TrackingGlassCard className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 rounded-full border border-border/70 bg-muted/30 p-2.5">
          <MapPin className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t("selectDriverTitle")}</p>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
          {t("selectDriverHint")}
        </p>
      </TrackingGlassCard>
    );
  }

  const fleetStatus = fleetStatusFromLocation({
    pinStatus: driver.pinStatus,
    trackingStatus: driver.trackingStatus,
    isOnDuty: driver.isOnDuty,
  });
  const gpsQuality = gpsQualityFromAccuracy(driver.accuracyMeters);

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border/80 bg-background/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-base font-semibold text-primary">
            {driverInitials(driver.driverName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{driver.driverName}</p>
            <p className="font-mono text-xs text-muted-foreground">#{driver.driverCode}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TrackingStatusPill
                status={fleetStatus}
                label={driver.isOnDuty ? t("onDuty") : t("offDuty")}
              />
              {meta?.zoneName ? (
                <Badge variant="secondary" className="text-[10px]">
                  {meta.zoneName}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {meta?.detailHref ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              render={<Link href={meta.detailHref} />}
            >
              {t("viewDriverDetails")}
            </Button>
          ) : null}
          {meta?.phone ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              render={<a href={`tel:${meta.phone}`} />}
            >
              <Phone className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 shadow-xs">
            <p className="text-muted-foreground">{t("shiftGpsRow")}</p>
            <p className="mt-0.5 font-medium">{formatDurationSince(driver.lastSeenAt)}</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 shadow-xs">
            <p className="text-muted-foreground">{t("gpsQuality")}</p>
            <p className="mt-0.5 font-medium">{t(`gpsQualityLevel.${gpsQuality}`)}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("liveMetrics")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <TrackingMetricTile
              label={t("colSpeed")}
              value={formatSpeedKmh(driver.speedMps)}
            />
            <TrackingMetricTile
              label={t("metricDistanceToday")}
              value="—"
              hint={t("comingSoon")}
            />
            <TrackingMetricTile
              label={t("metricOrdersCompleted")}
              value="—"
              hint={t("comingSoon")}
            />
            <TrackingMetricTile
              label={t("colBattery")}
              value={formatBatteryLevel(driver.batteryPct)}
              accent={
                driver.batteryPct != null && driver.batteryPct < 20 ? "warning" : "default"
              }
            />
            <TrackingMetricTile
              label={t("colAccuracy")}
              value={formatAccuracyMeters(driver.accuracyMeters)}
            />
            <TrackingMetricTile
              label={t("colZone")}
              value={
                driver.zoneStatus
                  ? t(`zoneStatus.${driver.zoneStatus}`)
                  : t("zoneStatus.unknown")
              }
              accent={driver.zoneStatus === "out_of_zone" ? "danger" : "default"}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("activitySummary")}
          </h3>
          <ul className="space-y-2 text-xs">
            <li className="flex justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
              <span className="text-muted-foreground">{t("colTrackingStatus")}</span>
              <span className="font-medium">
                {driver.trackingStatus === "moving"
                  ? t("statusMoving")
                  : driver.trackingStatus === "delivery_submit"
                    ? t("statusDeliverySubmit")
                    : t("statusIdle")}
              </span>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
              <span className="text-muted-foreground">{t("colLastSeen")}</span>
              <span className="font-medium">{formatTimestampLabel(driver.lastSeenAt)}</span>
            </li>
            {meta?.partnerName ? (
              <li className="flex justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
                <span className="text-muted-foreground">{t("filterPartner")}</span>
                <span className="truncate font-medium">{meta.partnerName}</span>
              </li>
            ) : null}
            {driver.restaurantName ? (
              <li className="flex justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
                <span className="text-muted-foreground">{t("restaurant")}</span>
                <span className="truncate font-medium">{driver.restaurantName}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </TrackingGlassCard>
  );
}
