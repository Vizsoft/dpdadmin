"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/metric-tile";
import { ZoneMap } from "./zone-map";
import { ZonePlaceSearch } from "./zone-place-search";
import type { ZoneMapAdapter, ZoneMapViewport } from "./zone-map-adapter";
import type { ZoneRow } from "./types";

export function ZoneMapPanel({
  zones,
  selectedId,
  onZoneSelect,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  onZoneSelect?: (zoneId: string) => void;
}) {
  const t = useTranslations("pages.zones");
  const mapAdapterRef = useRef<ZoneMapAdapter | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | "inclusion" | "exclusion">("all");

  const handleMapReady = useCallback((adapter: ZoneMapAdapter) => {
    mapAdapterRef.current = adapter;
  }, []);

  const handlePlaceSelect = useCallback(
    (place: { lat: number; lng: number; viewport?: ZoneMapViewport }) => {
      const adapter = mapAdapterRef.current;
      if (!adapter) return;
      if (place.viewport) {
        adapter.fitViewport(place.viewport);
      } else {
        adapter.panTo(place.lat, place.lng, 14);
      }
    },
    [],
  );

  const visibleZones = useMemo(
    () =>
      zones
        .filter((zone) =>
          kindFilter === "all" ? true : zone.geofence_kind === kindFilter,
        )
        .map((zone) => ({
          ...zone,
          color:
            zone.geofence_kind === "exclusion"
              ? "#ef4444"
              : zone.geofence_kind === "inclusion"
                ? "#14b8a6"
                : zone.color,
        })),
    [kindFilter, zones],
  );

  return (
    <div className="relative z-0 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          {(["all", "inclusion", "exclusion"] as const).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setKindFilter(chip)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                kindFilter === chip
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {chip === "all"
                ? t("geofence.filterAll")
                : t(`geofence.kind.${chip}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <ZonePlaceSearch
          onSelect={handlePlaceSelect}
          className="pointer-events-auto mt-12 w-full max-w-sm"
        />
      </div>
      <ZoneMap
        zones={visibleZones}
        selectedId={selectedId}
        onMapReady={handleMapReady}
        onZoneSelect={onZoneSelect}
        className="zones-background-map zones-google-map h-full min-h-[480px] w-full"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {t("zoneLegend")}
          </span>
          <div className="flex items-center gap-1.5">
            <Pill tone="emerald">{t("geofence.kind.inclusion")}</Pill>
            <Pill tone="rose">{t("geofence.kind.exclusion")}</Pill>
            <Pill tone="slate">{t("inactiveZone")}</Pill>
          </div>
          <button type="button" className="cursor-pointer text-start text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            {t("viewAll", { count: zones.length })}
          </button>
        </div>
      </div>
    </div>
  );
}
