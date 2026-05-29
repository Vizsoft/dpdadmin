"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { loadGoogleMaps } from "@/lib/google-maps/load";
import { GoogleMapsStatusBanner } from "@/features/restaurants/google-maps-status-banner";
import { cn } from "@/lib/utils";
import { DELIVERY_MARKER_COLORS, MAP_COLORS } from "@/lib/ui/map-colors";
import type { DeliveryMapPoint, DeliveryMapPointKind } from "./types";

const MARKER_COLORS: Record<DeliveryMapPointKind, string> = DELIVERY_MARKER_COLORS;

function kindLabelKey(kind: DeliveryMapPointKind): string {
  switch (kind) {
    case "pickup":
      return "mapLegendPickup";
    case "delivered":
      return "mapLegendDelivered";
    case "cancelled":
      return "mapLegendCancelled";
    case "live":
      return "mapLegendLive";
  }
}

function averageCenter(points: DeliveryMapPoint[]): { lat: number; lng: number } {
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

export function DeliveryLocationMap({
  points,
  className,
  mapHeightClass = "h-[200px]",
}: {
  points: DeliveryMapPoint[];
  className?: string;
  mapHeightClass?: string;
}) {
  const t = useTranslations("pages.deliveries");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("@/lib/google-maps/load").GoogleMapInstance | null>(
    null,
  );
  const overlaysRef = useRef<
    Array<{ setMap: (map: import("@/lib/google-maps/load").GoogleMapInstance | null) => void }>
  >([]);
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container || points.length === 0) {
      setMapState(points.length === 0 ? "unavailable" : "loading");
      return;
    }

    loadGoogleMaps().then((google) => {
      if (cancelled || !container) return;
      if (!google?.maps?.Map) {
        setMapState("unavailable");
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      for (const p of points) {
        bounds.extend({ lat: p.lat, lng: p.lng });
      }

      const map =
        mapRef.current ??
        new google.maps.Map(container, {
          center: averageCenter(points),
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
      mapRef.current = map;

      for (const overlay of overlaysRef.current) {
        overlay.setMap(null);
      }
      overlaysRef.current = [];

      for (const point of points) {
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          draggable: false,
          title: t(kindLabelKey(point.kind)),
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: MARKER_COLORS[point.kind],
            fillOpacity: 1,
            strokeColor: MAP_COLORS.markerStroke,
            strokeWeight: 2,
          },
        });
        overlaysRef.current.push(marker);
      }

      const routePoints = points.filter((p) => p.kind !== "live");
      if (routePoints.length >= 2 && "Polyline" in google.maps) {
        const Polyline = (
          google.maps as unknown as {
            Polyline: new (opts: {
              path: Array<{ lat: number; lng: number }>;
              geodesic: boolean;
              strokeColor: string;
              strokeOpacity: number;
              strokeWeight: number;
            }) => { setMap: (map: import("@/lib/google-maps/load").GoogleMapInstance | null) => void };
          }
        ).Polyline;
        const polyline = new Polyline({
          path: routePoints.map((p) => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: MAP_COLORS.routeStroke,
          strokeOpacity: 0.8,
          strokeWeight: 2,
        });
        polyline.setMap(map);
        overlaysRef.current.push(polyline);
      }

      if (points.length === 1) {
        map.setCenter({ lat: points[0]!.lat, lng: points[0]!.lng });
        map.setZoom(16);
      } else {
        map.fitBounds(bounds, 48);
      }

      setMapState("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [pointsKey, points, t]);

  useEffect(() => {
    return () => {
      for (const overlay of overlaysRef.current) {
        overlay.setMap(null);
      }
      overlaysRef.current = [];
      mapRef.current = null;
    };
  }, []);

  const legendKinds = [...new Set(points.map((p) => p.kind))];

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border", className)}>
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("locationTitle")}
        </p>
        {legendKinds.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {legendKinds.map((kind) => (
              <span
                key={kind}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: MARKER_COLORS[kind] }}
                />
                {t(kindLabelKey(kind))}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className={cn("relative w-full bg-muted", mapHeightClass)}>
        {mapState === "loading" && points.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {points.length === 0 || mapState === "unavailable" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            {mapState === "unavailable" ? (
              <GoogleMapsStatusBanner className="max-w-sm text-center" />
            ) : null}
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

export function deliveryMapPointsFromRow(row: {
  status: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  delivered_lat: number | null;
  delivered_lng: number | null;
  cancel_lat: number | null;
  cancel_lng: number | null;
}): DeliveryMapPoint[] {
  const points: DeliveryMapPoint[] = [];
  if (row.pickup_lat != null && row.pickup_lng != null) {
    points.push({ lat: row.pickup_lat, lng: row.pickup_lng, kind: "pickup" });
  }
  if (row.delivered_lat != null && row.delivered_lng != null) {
    points.push({ lat: row.delivered_lat, lng: row.delivered_lng, kind: "delivered" });
  }
  if (row.cancel_lat != null && row.cancel_lng != null) {
    points.push({ lat: row.cancel_lat, lng: row.cancel_lng, kind: "cancelled" });
  }
  return points;
}
