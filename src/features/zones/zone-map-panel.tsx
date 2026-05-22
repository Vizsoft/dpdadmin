"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ZoneMap } from "./zone-map";
import { ZonePlaceSearch } from "./zone-place-search";
import type { ZoneMapAdapter } from "./zone-map-adapter";
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
  const mapAdapterRef = useRef<ZoneMapAdapter | null>(null);

  const handleMapReady = useCallback((adapter: ZoneMapAdapter) => {
    mapAdapterRef.current = adapter;
  }, []);

  const handlePlaceSelect = useCallback(
    (place: { lat: number; lng: number; viewport?: import("./zone-map-adapter").ZoneMapViewport }) => {
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

  return (
    <div
      className={cn(
        "relative z-0 min-h-0 flex-1",
        sheetOpen && "pointer-events-none",
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
        <ZonePlaceSearch
          onSelect={handlePlaceSelect}
          className="pointer-events-auto w-full max-w-sm"
        />
      </div>
      <ZoneMap
        zones={zones}
        selectedId={selectedId}
        onMapReady={handleMapReady}
        onZoneSelect={onZoneSelect}
        className="zones-background-map zones-google-map h-full min-h-[480px] w-full"
      />
    </div>
  );
}
