"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { GeofenceKind, ZoneRow } from "./types";

export function ZoneGeofencesSummary({ zones }: { zones: ZoneRow[] }) {
  const t = useTranslations("pages.zones");

  const stats = useMemo(() => {
    const active = zones.filter((z) => z.status === "active").length;
    const inclusion = zones.filter((z) => z.geofence_kind === "inclusion").length;
    const exclusion = zones.filter((z) => z.geofence_kind === "exclusion").length;
    return { total: zones.length, active, inclusion, exclusion };
  }, [zones]);

  const cards: Array<{ label: string; value: number; accent?: string }> = [
    { label: t("geofence.summaryTotal"), value: stats.total },
    { label: t("geofence.summaryActive"), value: stats.active, accent: "text-emerald-600" },
    { label: t("geofence.summaryInclusion"), value: stats.inclusion },
    { label: t("geofence.summaryExclusion"), value: stats.exclusion, accent: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-sm"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {card.label}
          </p>
          <p className={`mt-0.5 text-xl font-semibold tabular-nums ${card.accent ?? ""}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function zoneMatchesKindFilter(
  zone: ZoneRow,
  kindFilter: "all" | GeofenceKind,
): boolean {
  if (kindFilter === "all") return true;
  return zone.geofence_kind === kindFilter;
}
