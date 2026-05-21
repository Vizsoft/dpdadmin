"use client";

import { cn } from "@/lib/utils";
import { ZoneMap } from "./zone-map";
import type { ZoneRow } from "./types";

export function ZoneMapPanel({
  zones,
  selectedId,
  sheetOpen = false,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  sheetOpen?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative z-0 min-h-0 flex-1",
        sheetOpen && "pointer-events-none",
      )}
    >
      <ZoneMap
        zones={zones}
        selectedId={selectedId}
        className="zones-background-map zones-leaflet-map h-full min-h-[480px] w-full"
      />
    </div>
  );
}
