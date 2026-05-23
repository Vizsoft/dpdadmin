"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { haversineMeters } from "@/features/locations/location-status";
import { fetchLocationEventByDeliveryId } from "@/features/locations/locations-actions";

export function DeliveryGpsAuditPanel({
  deliveryId,
  deliveredLat,
  deliveredLng,
}: {
  deliveryId: string;
  deliveredLat: number | null;
  deliveredLng: number | null;
}) {
  const t = useTranslations("pages.deliveries.gpsAudit");

  const { data: event, isLoading } = useQuery({
    queryKey: ["delivery-gps-audit", deliveryId],
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

  const divergenceM =
    deliveredLat != null && deliveredLng != null
      ? haversineMeters(event.latitude, event.longitude, deliveredLat, deliveredLng)
      : null;

  const diverged = divergenceM != null && divergenceM > 50;

  return (
    <div className="mb-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("title")}
        </p>
        {diverged ? (
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
        {deliveredLat != null && deliveredLng != null ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("deliveryCoords")}</dt>
            <dd className="font-mono">
              {deliveredLat.toFixed(5)}, {deliveredLng.toFixed(5)}
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
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t("zoneAtSubmit")}</dt>
          <dd>{event.zoneStatus ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
