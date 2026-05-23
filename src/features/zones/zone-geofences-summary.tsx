"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Activity, MapPinned, ShieldAlert, ShieldCheck } from "lucide-react";
import { MetricTile } from "@/components/ui/metric-tile";
import type { GeofenceKind, ZoneRow } from "./types";

export function ZoneGeofencesSummary({ zones }: { zones: ZoneRow[] }) {
  const t = useTranslations("pages.zones");

  const stats = useMemo(() => {
    const active = zones.filter((z) => z.status === "active").length;
    const inclusion = zones.filter((z) => z.geofence_kind === "inclusion").length;
    const exclusion = zones.filter((z) => z.geofence_kind === "exclusion").length;
    return { total: zones.length, active, inclusion, exclusion };
  }, [zones]);

  const cards = [
    {
      label: t("geofence.summaryTotal"),
      value: stats.total,
      tone: "blue" as const,
      icon: MapPinned,
    },
    {
      label: t("geofence.summaryActive"),
      value: stats.active,
      tone: "emerald" as const,
      icon: Activity,
    },
    {
      label: t("geofence.summaryInclusion"),
      value: stats.inclusion,
      tone: "emerald" as const,
      icon: ShieldCheck,
    },
    {
      label: t("geofence.summaryExclusion"),
      value: stats.exclusion,
      tone: "rose" as const,
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((card) => (
        <MetricTile
          key={card.label}
          label={card.label}
          value={card.value}
          tone={card.tone}
          icon={card.icon}
        />
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
