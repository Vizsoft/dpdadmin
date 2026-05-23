"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps/load";
import { GoogleMapsStatusBanner } from "@/features/restaurants/google-maps-status-banner";
import { cn } from "@/lib/utils";

export function DeliveryLocationMap({
  lat,
  lng,
  className,
  mapHeightClass = "h-[200px]",
}: {
  lat: number;
  lng: number;
  className?: string;
  mapHeightClass?: string;
}) {
  const t = useTranslations("pages.deliveries");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("@/lib/google-maps/load").GoogleMapInstance | null>(
    null,
  );
  const markerRef = useRef<
    import("@/lib/google-maps/load").GoogleMarkerInstance | null
  >(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    loadGoogleMaps().then((google) => {
      if (cancelled || !container) return;
      if (!google?.maps?.Map) {
        setMapState("unavailable");
        return;
      }

      const center = { lat, lng };
      const map = new google.maps.Map(container, {
        center,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });
      mapRef.current = map;

      const marker = new google.maps.Marker({
        position: center,
        map,
        draggable: false,
      });
      markerRef.current = marker;
      setMapState("ready");
    });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border", className)}>
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("locationTitle")}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {t("coordinates", { lat: lat.toFixed(5), lng: lng.toFixed(5) })}
        </p>
      </div>
      <div className={cn("relative w-full bg-muted", mapHeightClass)}>
        {mapState === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {mapState === "unavailable" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <GoogleMapsStatusBanner className="max-w-sm text-center" />
            <p className="text-center text-xs text-muted-foreground">
              {t("locationUnavailable")}
            </p>
          </div>
        ) : null}
        <div ref={containerRef} className="h-full w-full" aria-hidden={mapState !== "ready"} />
      </div>
    </div>
  );
}
