"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Circle,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import "leaflet/dist/leaflet.css";
import type { ZoneGeoFeature, ZoneGeometryType } from "@/lib/geo/zone-geometry";
import {
  circleFromFeature,
  polygonPositionsFromFeature,
} from "@/lib/geo/zone-geometry";
import {
  DEFAULT_MAP_ZOOM,
  getZoneMapTileProps,
  KUWAIT_MAP_CENTER,
  ZONE_FILL_COLOR,
  ZONE_STROKE_COLOR,
} from "./constants";
import type { ZoneRow } from "./types";

function FitBounds({ zones, selectedId }: { zones: ZoneRow[]; selectedId: string | null }) {
  const map = useMap();

  useEffect(() => {
    const target = selectedId
      ? zones.find((z) => z.id === selectedId)
      : zones.find((z) => z.geometry);

    if (!target?.geometry) return;

    if (target.zone_type === "circle") {
      const circle = circleFromFeature(target.geometry);
      if (!circle) return;
      const bounds = L.circle(circle.center, { radius: circle.radiusMeters }).getBounds();
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      return;
    }

    const positions = polygonPositionsFromFeature(target.geometry);
    if (positions.length < 3) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15 });
  }, [map, zones, selectedId]);

  return null;
}

function ZoneOverlay({
  zone,
  selected,
}: {
  zone: ZoneRow;
  selected: boolean;
}) {
  if (!zone.geometry) return null;

  const opacity = selected ? 0.35 : 0.15;
  const weight = selected ? 3 : 2;

  if (zone.zone_type === "circle") {
    const circle = circleFromFeature(zone.geometry);
    if (!circle) return null;
    return (
      <Circle
        center={circle.center}
        radius={circle.radiusMeters}
        pathOptions={{
          color: ZONE_STROKE_COLOR,
          fillColor: ZONE_FILL_COLOR,
          fillOpacity: opacity,
          weight,
        }}
      />
    );
  }

  const positions = polygonPositionsFromFeature(zone.geometry);
  if (positions.length < 3) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: ZONE_STROKE_COLOR,
        fillColor: ZONE_FILL_COLOR,
        fillOpacity: opacity,
        weight,
      }}
    />
  );
}

export type ZoneMapDrawMode = "polygon" | "circle" | null;

function GeomanDrawControl({
  drawMode,
  onGeometryChange,
}: {
  drawMode: ZoneMapDrawMode;
  onGeometryChange: (geometry: ZoneGeoFeature, zoneType: ZoneGeometryType) => void;
}) {
  const map = useMap();
  const onGeometryChangeRef = useRef(onGeometryChange);

  useEffect(() => {
    onGeometryChangeRef.current = onGeometryChange;
  });

  useEffect(() => {
    if (!drawMode) return;

    map.pm.setGlobalOptions({
      allowSelfIntersection: false,
      snappable: true,
    });

    map.pm.addControls({
      position: "topright",
      drawCircle: drawMode === "circle",
      drawPolygon: drawMode === "polygon",
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircleMarker: false,
      drawText: false,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    const emitGeometry = (geometry: ZoneGeoFeature, zoneType: ZoneGeometryType) => {
      onGeometryChangeRef.current(geometry, zoneType);
    };

    const handleCreate = (e: L.LeafletEvent & { layer: L.Layer }) => {
      const layer = e.layer;
      map.eachLayer((l) => {
        if (l !== layer && "pm" in l && (l as L.Layer & { pm?: unknown }).pm) {
          map.removeLayer(l);
        }
      });

      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radiusMeters = layer.getRadius();
        emitGeometry(
          {
            type: "Feature",
            properties: { radiusMeters },
            geometry: {
              type: "Point",
              coordinates: [center.lng, center.lat],
            },
          },
          "circle",
        );
      } else if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs()[0] as L.LatLng[];
        const coordinates = latlngs.map((ll) => [ll.lng, ll.lat] as [number, number]);
        if (coordinates.length > 0) {
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coordinates.push([...first]);
          }
        }
        emitGeometry(
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [coordinates] },
          },
          "polygon",
        );
      }
    };

    const handleEdit = () => {
      map.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
          const center = layer.getLatLng();
          emitGeometry(
            {
              type: "Feature",
              properties: { radiusMeters: layer.getRadius() },
              geometry: {
                type: "Point",
                coordinates: [center.lng, center.lat],
              },
            },
            "circle",
          );
        } else if (layer instanceof L.Polygon && layer.pm) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          const coordinates = latlngs.map((ll) => [ll.lng, ll.lat] as [number, number]);
          if (coordinates.length > 0) {
            const first = coordinates[0];
            const last = coordinates[coordinates.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
              coordinates.push([...first]);
            }
          }
          emitGeometry(
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [coordinates] },
            },
            "polygon",
          );
        }
      });
    };

    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);

    return () => {
      map.off("pm:create", handleCreate);
      map.off("pm:edit", handleEdit);
      map.pm.removeControls();
    };
  }, [map, drawMode]);

  return null;
}

function ExistingGeometryLayer({
  geometry,
  zoneType,
}: {
  geometry: ZoneGeoFeature | null;
  zoneType: ZoneGeometryType;
}) {
  if (!geometry) return null;

  if (zoneType === "circle") {
    const circle = circleFromFeature(geometry);
    if (!circle) return null;
    return (
      <Circle
        center={circle.center}
        radius={circle.radiusMeters}
        pathOptions={{
          color: ZONE_STROKE_COLOR,
          fillColor: ZONE_FILL_COLOR,
          fillOpacity: 0.25,
          weight: 2,
        }}
      />
    );
  }

  const positions = polygonPositionsFromFeature(geometry);
  if (positions.length < 3) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: ZONE_STROKE_COLOR,
        fillColor: ZONE_FILL_COLOR,
        fillOpacity: 0.25,
        weight: 2,
      }}
    />
  );
}

export function ZoneMapInner({
  zones,
  selectedId,
  className,
  drawMode = null,
  draftGeometry = null,
  draftZoneType = "polygon",
  onDraftGeometryChange,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  className?: string;
  drawMode?: ZoneMapDrawMode;
  draftGeometry?: ZoneGeoFeature | null;
  draftZoneType?: ZoneGeometryType;
  onDraftGeometryChange?: (geometry: ZoneGeoFeature, zoneType: ZoneGeometryType) => void;
}) {
  const displayZones = useMemo(
    () => (drawMode ? [] : zones),
    [drawMode, zones],
  );

  const tile = useMemo(() => getZoneMapTileProps(), []);

  return (
    <MapContainer
      center={KUWAIT_MAP_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      className={className ?? "zones-leaflet-map h-full w-full rounded-xl"}
      scrollWheelZoom
    >
      <TileLayer attribution={tile.attribution} url={tile.url} />
      {!drawMode &&
        displayZones.map((zone) => (
          <ZoneOverlay
            key={zone.id}
            zone={zone}
            selected={zone.id === selectedId}
          />
        ))}
      {drawMode && onDraftGeometryChange && (
        <GeomanDrawControl
          drawMode={drawMode}
          onGeometryChange={onDraftGeometryChange}
        />
      )}
      {drawMode && (
        <ExistingGeometryLayer geometry={draftGeometry ?? null} zoneType={draftZoneType} />
      )}
      {!drawMode && <FitBounds zones={zones} selectedId={selectedId} />}
    </MapContainer>
  );
}
