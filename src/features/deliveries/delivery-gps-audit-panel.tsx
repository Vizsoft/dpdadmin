"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { haversineMeters } from "@/features/locations/location-status";
import { fetchLocationEventByDeliveryId } from "@/features/locations/locations-actions";
import { queryKeys } from "@/lib/query/query-keys";

export function DeliveryGpsAuditPanel({
  deliveryId,
  deliveredLat,
  deliveredLng,
  cancelLat,
  cancelLng,
}: {
  deliveryId: string;
  deliveredLat: number | null;
  deliveredLng: number | null;
  cancelLat?: number | null;
  cancelLng?: number | null;
}) {
  const t = useTranslations("pages.deliveries.gpsAudit");

  const { data: event, isLoading } = useQuery({
    queryKey: queryKeys.deliveries.deliveryGpsAudit(deliveryId),
    queryFn: () => fetchLocationEventByDeliveryId(deliveryId),
  });

  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!event) return null;

  const referenceLat = deliveredLat ?? cancelLat ?? null;
  const referenceLng = deliveredLng ?? cancelLng ?? null;

  const divergenceM =
    referenceLat != null && referenceLng != null
      ? haversineMeters(event.latitude, event.longitude, referenceLat, referenceLng)
      : null;

  const diverged = divergenceM != null && divergenceM > 50;
  const showMockBadge = event.isMocked === true;

  return (
    <div className="mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("title")}
        </p>
        {showMockBadge ? (
          <StatusPill variant="danger">{t("mockLocation")}</StatusPill>
        ) : diverged ? (
          <StatusPill variant="danger">{t("divergenceWarning")}</StatusPill>
        ) : (
          <StatusPill variant="success">{t("coordsMatch")}</StatusPill>
        )}
      </div>
      <dl className="space-y-1 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("trackingCoords")}</dt>
          <dd className="font-mono">
            {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
          </dd>
        </div>
        {referenceLat != null && referenceLng != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("deliveryCoords")}</dt>
            <dd className="font-mono">
              {referenceLat.toFixed(5)}, {referenceLng.toFixed(5)}
            </dd>
          </div>
        ) : null}
        {divergenceM != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("divergence")}</dt>
            <dd>{Math.round(divergenceM)} m</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("accuracy")}</dt>
          <dd>
            {event.accuracyMeters != null ? `${Math.round(event.accuracyMeters)} m` : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("battery")}</dt>
          <dd>{event.batteryPct != null ? `${event.batteryPct}%` : "—"}</dd>
        </div>
        {event.headingDeg != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("heading")}</dt>
            <dd>{Math.round(event.headingDeg)}°</dd>
          </div>
        ) : null}
        {event.altitudeM != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("altitude")}</dt>
            <dd>{Math.round(event.altitudeM)} m</dd>
          </div>
        ) : null}
        {event.networkType ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("network")}</dt>
            <dd>{event.networkType}</dd>
          </div>
        ) : null}
        {event.chargingState ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("charging")}</dt>
            <dd>{event.chargingState}</dd>
          </div>
        ) : null}
        {event.locationProvider ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("provider")}</dt>
            <dd>{event.locationProvider}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("zoneAtSubmit")}</dt>
          <dd>{event.zoneStatus ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
