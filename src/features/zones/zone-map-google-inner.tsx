"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  getGoogleMapsLoadFailure,
  loadGoogleMaps,
  type GoogleCircleInstance,
  type GoogleMapInstance,
  type GoogleMapsApi,
  type GoogleOverlayViewInstance,
  type GooglePolygonInstance,
} from "@/lib/google-maps/load";
import {
  zoneMapBoundsFromShape,
  type ZoneGeoFeature,
  type ZoneGeometryType,
} from "@/lib/geo/zone-geometry";
import { GoogleMapsStatusBanner } from "@/features/restaurants/google-maps-status-banner";
import {
  DEFAULT_MAP_ZOOM,
  KUWAIT_MAP_CENTER,
  ZONE_REFERENCE_FILL_OPACITY,
  ZONE_REFERENCE_STROKE_OPACITY,
} from "./constants";
import { normalizeZoneColor } from "./zone-colors";
import type { ZoneMapDrawMode } from "./zone-map-inner";
import type { ZoneRow } from "./types";
import type { ZoneMapAdapter } from "./zone-map-adapter";
import { ZoneMapLayersControl } from "./zone-map-layers-control";
import { useGoogleLiveDriverMarkers } from "./zone-live-drivers-markers";
import { createZoneLabelOverlay } from "./zone-map-google-label";
import {
  DEFAULT_ZONE_MAP_PREFS,
  loadZoneMapPrefs,
  subscribeZoneMapPrefs,
  type ZoneMapLayerPrefs,
} from "./zone-map-layer-prefs";
import {
  bindCircleEditListeners,
  bindPolygonEditListeners,
  circleFromZoneFeature,
  featureFromCircle,
  featureFromPolygon,
  googlePathOptions,
  polygonFromFeature,
} from "./zone-map-google-utils";

function tupleToLatLng(center: [number, number]) {
  return { lat: center[0], lng: center[1] };
}

function createMapAdapter(
  map: GoogleMapInstance,
  google: GoogleMapsApi,
  controls?: {
    setDrawMode?: (mode: "polygon" | "circle" | null) => void;
    setEditing?: (enabled: boolean) => void;
    setDragging?: (enabled: boolean) => void;
    deleteSelected?: () => void;
    clearDraft?: () => void;
  },
): ZoneMapAdapter {
  return {
    panTo(lat, lng, zoom = 14) {
      map.panTo({ lat, lng });
      map.setZoom(zoom);
    },
    fitViewport(viewport) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: viewport.north, lng: viewport.east });
      bounds.extend({ lat: viewport.south, lng: viewport.west });
      map.fitBounds(bounds, 48);
    },
    invalidateSize() {
      /* Google Maps auto-resizes */
    },
    setDrawMode: controls?.setDrawMode,
    setEditing: controls?.setEditing,
    setDragging: controls?.setDragging,
    deleteSelected: controls?.deleteSelected,
    clearDraft: controls?.clearDraft,
  };
}

export function ZoneMapGoogleInner({
  zones,
  selectedId,
  className,
  drawMode = null,
  excludeZoneId = null,
  draftGeometry = null,
  draftZoneType = "polygon",
  draftColor,
  onDraftGeometryChange,
  onMapReady,
  onZoneSelect,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  className?: string;
  drawMode?: ZoneMapDrawMode;
  excludeZoneId?: string | null;
  draftGeometry?: ZoneGeoFeature | null;
  draftZoneType?: ZoneGeometryType;
  draftColor?: string;
  onDraftGeometryChange?: (
    geometry: ZoneGeoFeature | null,
    zoneType: ZoneGeometryType,
  ) => void;
  onMapReady?: (adapter: ZoneMapAdapter) => void;
  onZoneSelect?: (zoneId: string) => void;
}) {
  const t = useTranslations("pages.zones");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const googleRef = useRef<GoogleMapsApi | null>(null);
  const zoneOverlaysRef = useRef<
    Array<{ id: string; layer: GooglePolygonInstance | GoogleCircleInstance }>
  >([]);
  const zoneLabelsRef = useRef<
    Array<{ id: string; overlay: GoogleOverlayViewInstance }>
  >([]);
  const showLabelsRef = useRef(true);
  const [mapPrefs, setMapPrefs] = useState<ZoneMapLayerPrefs>(DEFAULT_ZONE_MAP_PREFS);
  const draftOverlayRef = useRef<GooglePolygonInstance | GoogleCircleInstance | null>(
    null,
  );
  const drawingManagerRef = useRef<
    import("@/lib/google-maps/load").GoogleDrawingManagerInstance | null
  >(null);
  const onDraftChangeRef = useRef(onDraftGeometryChange);
  const drawModeRef = useRef(drawMode);
  const draftColorRef = useRef(normalizeZoneColor(draftColor));
  const [mapState, setMapState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );

  useGoogleLiveDriverMarkers(
    mapRef.current,
    mapState === "ready" && mapPrefs.showLiveDrivers,
  );

  onDraftChangeRef.current = onDraftGeometryChange;
  drawModeRef.current = drawMode;
  draftColorRef.current = normalizeZoneColor(draftColor);

  const referenceZones = useMemo(() => {
    if (!drawMode) return [];
    return zones.filter((z) => z.geometry && z.id !== excludeZoneId);
  }, [drawMode, zones, excludeZoneId]);

  const clearZoneOverlays = useCallback(() => {
    for (const o of zoneOverlaysRef.current) {
      o.layer.setMap(null);
    }
    zoneOverlaysRef.current = [];
  }, []);

  const clearZoneLabels = useCallback(() => {
    for (const o of zoneLabelsRef.current) {
      o.overlay.setMap(null);
    }
    zoneLabelsRef.current = [];
  }, []);

  useEffect(() => {
    showLabelsRef.current = mapPrefs.showLabels;
  }, [mapPrefs.showLabels]);

  useEffect(() => {
    setMapPrefs(loadZoneMapPrefs());
    const unsub = subscribeZoneMapPrefs((prefs) => setMapPrefs(prefs));
    return unsub;
  }, []);

  const clearDraftOverlay = useCallback(() => {
    if (draftOverlayRef.current) {
      draftOverlayRef.current.setMap(null);
      draftOverlayRef.current = null;
    }
  }, []);

  const fitZonesBounds = useCallback(
    (map: GoogleMapInstance, google: GoogleMapsApi, targetId: string | null) => {
      const bounds = new google.maps.LatLngBounds();
      let hasPoint = false;

      const list = targetId
        ? zones.filter((z) => z.id === targetId)
        : zones;

      for (const z of list) {
        if (!z.geometry) continue;
        const corners = zoneMapBoundsFromShape(z.zone_type, z.geometry);
        if (!corners) continue;
        for (const [lat, lng] of corners) {
          bounds.extend({ lat, lng });
          hasPoint = true;
        }
      }

      if (hasPoint) {
        map.fitBounds(bounds, 48);
      }
    },
    [zones],
  );

  const renderZoneOverlay = useCallback(
    (
      google: GoogleMapsApi,
      map: GoogleMapInstance,
      zone: ZoneRow,
      opts: {
        selected: boolean;
        reference: boolean;
        clickable: boolean;
      },
    ) => {
      if (!zone.geometry) return null;
      const color = normalizeZoneColor(zone.color);
      const fillOpacity = opts.reference
        ? ZONE_REFERENCE_FILL_OPACITY
        : opts.selected
          ? 0.35
          : 0.2;
      const weight = opts.reference ? 1.5 : opts.selected ? 3 : 2;
      const strokeOpacity = opts.reference ? ZONE_REFERENCE_STROKE_OPACITY : 1;

      const common = {
        fillOpacity,
        weight,
        strokeOpacity,
        clickable: opts.clickable,
      };

      let layer: GooglePolygonInstance | GoogleCircleInstance | null = null;

      if (zone.zone_type === "circle") {
        layer = circleFromZoneFeature(google, map, zone.geometry, color, common);
      } else {
        layer = polygonFromFeature(google, map, zone.geometry, color, common);
      }

      if (layer && opts.clickable) {
        layer.addListener("click", () => onZoneSelect?.(zone.id));
      }

      return layer;
    },
    [onZoneSelect],
  );

  const syncBrowseOverlays = useCallback(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || drawMode) return;

    clearZoneOverlays();
    for (const zone of zones) {
      if (!zone.geometry) continue;
      const layer = renderZoneOverlay(google, map, zone, {
        selected: zone.id === selectedId,
        reference: false,
        clickable: Boolean(onZoneSelect),
      });
      if (layer) {
        zoneOverlaysRef.current.push({ id: zone.id, layer });
      }
    }
    fitZonesBounds(map, google, selectedId);
  }, [
    zones,
    selectedId,
    drawMode,
    clearZoneOverlays,
    renderZoneOverlay,
    fitZonesBounds,
    onZoneSelect,
  ]);

  const syncZoneLabels = useCallback(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || drawMode || !showLabelsRef.current) {
      clearZoneLabels();
      return;
    }

    clearZoneLabels();
    for (const zone of zones) {
      if (!zone.geometry) continue;
      const overlay = createZoneLabelOverlay(google, map, zone, {
        onSelect: onZoneSelect,
      });
      if (overlay) {
        zoneLabelsRef.current.push({ id: zone.id, overlay });
      }
    }
  }, [zones, drawMode, clearZoneLabels, onZoneSelect]);

  const syncReferenceOverlays = useCallback(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || !drawMode) return;

    clearZoneOverlays();
    for (const zone of referenceZones) {
      const layer = renderZoneOverlay(google, map, zone, {
        selected: false,
        reference: true,
        clickable: false,
      });
      if (layer) {
        zoneOverlaysRef.current.push({ id: zone.id, layer });
      }
    }
  }, [drawMode, referenceZones, clearZoneOverlays, renderZoneOverlay]);

  const attachDraftFromGeometry = useCallback(
    (
      geometry: ZoneGeoFeature,
      zoneType: ZoneGeometryType,
      editable: boolean,
    ) => {
      const map = mapRef.current;
      const google = googleRef.current;
      if (!map || !google) return;

      clearDraftOverlay();
      const color = draftColorRef.current;

      if (zoneType === "circle") {
        const circle = circleFromZoneFeature(google, map, geometry, color, {
          editable,
          fillOpacity: 0.35,
          weight: 3,
        });
        if (circle) {
          if (editable) {
            bindCircleEditListeners(circle, (g, t) =>
              onDraftChangeRef.current?.(g, t),
            );
          }
          draftOverlayRef.current = circle;
        }
      } else {
        const polygon = polygonFromFeature(google, map, geometry, color, {
          editable,
          fillOpacity: 0.35,
          weight: 3,
        });
        if (polygon) {
          if (editable) {
            bindPolygonEditListeners(polygon, (g, t) =>
              onDraftChangeRef.current?.(g, t),
            );
          }
          draftOverlayRef.current = polygon;
        }
      }
    },
    [clearDraftOverlay],
  );

  const setupDrawingManager = useCallback(() => {
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google || !drawMode || !google.maps.drawing) return;

    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }

    const color = draftColorRef.current;
    const pathOpts = googlePathOptions(color, { fillOpacity: 0.35, weight: 3 });

    const dm = new google.maps.drawing.DrawingManager({
      map,
      drawingControl: false,
      drawingMode: draftGeometry
        ? null
        : drawMode === "circle"
          ? google.maps.drawing.OverlayType.CIRCLE
          : google.maps.drawing.OverlayType.POLYGON,
      polygonOptions: { ...pathOpts, editable: true, draggable: true },
      circleOptions: { ...pathOpts, editable: true, draggable: true },
    });

    dm.addListener("overlaycomplete", (e) => {
      const overlay = e.overlay;
      dm.setDrawingMode(null);

      if (e.type === google.maps.drawing.OverlayType.CIRCLE) {
        const circle = overlay as GoogleCircleInstance;
        circle.setEditable(true);
        const feature = featureFromCircle(circle);
        if (feature) {
          clearDraftOverlay();
          draftOverlayRef.current = circle;
          bindCircleEditListeners(circle, (g, t) =>
            onDraftChangeRef.current?.(g, t),
          );
          onDraftChangeRef.current?.(feature, "circle");
        }
      } else if (e.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = overlay as GooglePolygonInstance;
        polygon.setEditable(true);
        const feature = featureFromPolygon(polygon);
        if (feature) {
          clearDraftOverlay();
          draftOverlayRef.current = polygon;
          bindPolygonEditListeners(polygon, (g, t) =>
            onDraftChangeRef.current?.(g, t),
          );
          onDraftChangeRef.current?.(feature, "polygon");
        }
      }
    });

    drawingManagerRef.current = dm;
  }, [drawMode, draftGeometry, clearDraftOverlay]);

  const handleClearShape = useCallback(() => {
    clearDraftOverlay();
    if (drawingManagerRef.current && googleRef.current) {
      const mode = drawModeRef.current;
      drawingManagerRef.current.setDrawingMode(
        mode === "circle"
          ? googleRef.current.maps.drawing.OverlayType.CIRCLE
          : googleRef.current.maps.drawing.OverlayType.POLYGON,
      );
    }
    onDraftChangeRef.current?.(
      null,
      drawModeRef.current === "circle" ? "circle" : "polygon",
    );
  }, [clearDraftOverlay]);

  const handleDeleteShape = useCallback(() => {
    clearDraftOverlay();
    onDraftChangeRef.current?.(
      null,
      drawModeRef.current === "circle" ? "circle" : "polygon",
    );
  }, [clearDraftOverlay]);

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

      googleRef.current = google;
      const map = new google.maps.Map(container, {
        center: tupleToLatLng(KUWAIT_MAP_CENTER),
        zoom: DEFAULT_MAP_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      });
      mapRef.current = map;
      onMapReady?.(
        createMapAdapter(map, google, {
          setDrawMode(mode) {
            if (!drawingManagerRef.current) return;
            if (!mode) {
              drawingManagerRef.current.setDrawingMode(null);
              return;
            }
            drawingManagerRef.current.setDrawingMode(
              mode === "circle"
                ? google.maps.drawing.OverlayType.CIRCLE
                : google.maps.drawing.OverlayType.POLYGON,
            );
          },
          setEditing(enabled) {
            if (!draftOverlayRef.current) return;
            draftOverlayRef.current.setEditable(enabled);
          },
          setDragging(enabled) {
            if (!draftOverlayRef.current) return;
            draftOverlayRef.current.setDraggable(enabled);
          },
          deleteSelected() {
            handleDeleteShape();
          },
          clearDraft() {
            handleClearShape();
          },
        }),
      );
      setMapState("ready");
    });

    return () => {
      cancelled = true;
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      clearDraftOverlay();
      clearZoneOverlays();
      clearZoneLabels();
      mapRef.current = null;
      googleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, [handleClearShape, handleDeleteShape, onMapReady, clearDraftOverlay, clearZoneOverlays, clearZoneLabels]);

  useEffect(() => {
    if (mapState !== "ready") return;
    if (drawMode) {
      clearZoneLabels();
      syncReferenceOverlays();
      if (draftGeometry) {
        if (!draftOverlayRef.current) {
          attachDraftFromGeometry(draftGeometry, draftZoneType, true);
        }
        if (drawingManagerRef.current) {
          drawingManagerRef.current.setDrawingMode(null);
        }
      } else {
        clearDraftOverlay();
        setupDrawingManager();
      }
    } else {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      clearDraftOverlay();
      clearZoneLabels();
      syncBrowseOverlays();
      syncZoneLabels();
    }
  }, [
    mapState,
    drawMode,
    draftGeometry,
    draftZoneType,
    zones,
    selectedId,
    syncBrowseOverlays,
    syncReferenceOverlays,
    syncZoneLabels,
    attachDraftFromGeometry,
    setupDrawingManager,
    clearDraftOverlay,
    clearZoneLabels,
  ]);

  useEffect(() => {
    if (mapState !== "ready" || drawMode) return;
    syncZoneLabels();
  }, [mapState, drawMode, mapPrefs.showLabels, zones, syncZoneLabels]);

  useEffect(() => {
    if (!draftOverlayRef.current || mapState !== "ready") return;
    const color = draftColorRef.current;
    draftOverlayRef.current.setOptions(googlePathOptions(color, { fillOpacity: 0.35, weight: 3 }));
  }, [draftColor, mapState]);

  useEffect(() => {
    if (mapState !== "ready" || drawMode) return;
    const map = mapRef.current;
    const google = googleRef.current;
    if (!map || !google) return;
    for (const o of zoneOverlaysRef.current) {
      const zone = zones.find((z) => z.id === o.id);
      if (!zone) continue;
      const selected = zone.id === selectedId;
      o.layer.setOptions(
        googlePathOptions(normalizeZoneColor(zone.color), {
          fillOpacity: selected ? 0.35 : 0.2,
          weight: selected ? 3 : 2,
        }),
      );
    }
    if (selectedId) {
      fitZonesBounds(map, google, selectedId);
    }
  }, [selectedId, mapState, drawMode, zones, fitZonesBounds]);

  if (mapState === "unavailable") {
    const failure = getGoogleMapsLoadFailure();
    return (
      <div
        className={
          className ??
          "flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6"
        }
      >
        <GoogleMapsStatusBanner className="max-w-md text-center" />
        {!failure ? (
          <p className="text-center text-xs text-muted-foreground">
            {t("hints.googleKeyMissing")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className ?? "relative h-full w-full"}>
      <div ref={containerRef} className="h-full w-full rounded-xl" />
      {mapState === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : null}
      {mapState === "ready" ? (
        <>
          <div className="pointer-events-none absolute bottom-3 start-3 z-10">
            <ZoneMapLayersControl
              map={mapRef.current}
              google={googleRef.current}
              className="pointer-events-auto"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
