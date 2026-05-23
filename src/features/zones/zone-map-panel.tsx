"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ZoneMap } from "./zone-map";
import { ZonePlaceSearch } from "./zone-place-search";
import type { ZoneMapAdapter, ZoneMapViewport } from "./zone-map-adapter";
import type { ZoneRow } from "./types";

export function ZoneMapPanel({
  zones,
  selectedId,
  sheetOpen = false,
  onZoneSelect,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  sheetOpen?: boolean;
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
    <div
      className={cn(
        "relative z-0 min-h-0 flex-1",
        sheetOpen && "pointer-events-none",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1 shadow-lg backdrop-blur">
          {(["all", "inclusion", "exclusion"] as const).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setKindFilter(chip)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all",
                kindFilter === chip
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
          <span className="font-medium text-foreground">{t("geofence.legend")}</span>
          <Badge variant="secondary" className="text-[10px]">
            {t("geofence.kind.inclusion")}
          </Badge>
          <Badge variant="destructive" className="text-[10px]">
            {t("geofence.kind.exclusion")}
          </Badge>
        </div>
      </div>
    </div>
  );
}
