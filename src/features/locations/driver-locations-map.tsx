"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps/load";
import { GoogleMapsStatusBanner } from "@/features/restaurants/google-maps-status-banner";
import { cn } from "@/lib/utils";
import type { DriverLocationMapMarker, DriverLocationMapPath } from "./types";

export function DriverLocationsMap({
  markers,
  path,
  className,
  mapHeightClass = "h-[220px]",
  fitToMarkers = true,
}: {
  markers: DriverLocationMapMarker[];
  path?: DriverLocationMapPath;
  className?: string;
  mapHeightClass?: string;
  fitToMarkers?: boolean;
}) {
  const t = useTranslations("pages.locations");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("@/lib/google-maps/load").GoogleMapInstance | null>(null);
  const markerRefs = useRef<import("@/lib/google-maps/load").GoogleMarkerInstance[]>([]);
  const polylineRef = useRef<{ setMap: (map: unknown) => void } | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">("loading");

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

      const defaultCenter =
        markers[0] != null
          ? { lat: markers[0].lat, lng: markers[0].lng }
          : path?.[0] != null
            ? { lat: path[0].lat, lng: path[0].lng }
            : { lat: 29.3759, lng: 47.9774 };

      const map = new google.maps.Map(container, {
        center: defaultCenter,
        zoom: markers.length === 1 && !path?.length ? 15 : 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });
      mapRef.current = map;
      setMapState("ready");
    });

    return () => {
      cancelled = true;
      for (const m of markerRefs.current) m.setMap(null);
      markerRefs.current = [];
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapState !== "ready") return;

    void loadGoogleMaps().then((google) => {
      if (!google?.maps?.Map || !mapRef.current) return;

      for (const m of markerRefs.current) m.setMap(null);
      markerRefs.current = [];

      for (const pin of markers) {
        const marker = new google.maps.Marker({
          position: { lat: pin.lat, lng: pin.lng },
          map: mapRef.current,
          title: pin.title,
        });
        markerRefs.current.push(marker);
      }

      polylineRef.current?.setMap(null);
      polylineRef.current = null;

      if (path && path.length >= 2) {
        const Polyline = (
          google.maps as unknown as {
            Polyline: new (opts: {
              path: { lat: number; lng: number }[];
              geodesic: boolean;
              strokeColor: string;
              strokeOpacity: number;
              strokeWeight: number;
              map: typeof map;
            }) => { setMap: (map: unknown) => void };
          }
        ).Polyline;

        if (Polyline) {
          polylineRef.current = new Polyline({
            path,
            geodesic: true,
            strokeColor: "#6366f1",
            strokeOpacity: 0.85,
            strokeWeight: 3,
            map: mapRef.current,
          });
        }
      }

      if (fitToMarkers && (markers.length > 0 || (path && path.length > 0))) {
        const bounds = new google.maps.LatLngBounds();
        for (const pin of markers) bounds.extend({ lat: pin.lat, lng: pin.lng });
        for (const pt of path ?? []) bounds.extend(pt);
        mapRef.current.fitBounds(bounds, 48);
      }
    });
  }, [markers, path, mapState, fitToMarkers]);

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border", className)}>
      <div className={cn("relative w-full bg-muted", mapHeightClass)}>
        {mapState === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {mapState === "unavailable" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <GoogleMapsStatusBanner className="max-w-sm text-center" />
            <p className="text-center text-xs text-muted-foreground">{t("mapUnavailable")}</p>
          </div>
        ) : null}
        <div ref={containerRef} className="h-full w-full" aria-hidden={mapState !== "ready"} />
      </div>
    </div>
  );
}
