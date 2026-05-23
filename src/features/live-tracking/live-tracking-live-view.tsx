"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { DriverLocationsMap } from "@/features/locations/driver-locations-map";
import { useDriverLocationsRealtime } from "@/features/locations/use-driver-locations-realtime";
import { fetchDriversForAdmin } from "@/features/drivers/drivers-actions";
import { fetchZones } from "@/features/zones/use-zones";
import { normalizeZoneColor } from "@/features/zones/zone-colors";
import { queryKeys } from "@/lib/query/query-keys";
import {
  DEFAULT_LIVE_TRACKING_FILTERS,
  matchesLiveTrackingFilters,
  type LiveTrackingFilterState,
} from "./live-tracking-filters";
import { FleetOverviewPanel } from "./fleet-overview-panel";
import { LiveDriverDetailsPanel } from "./live-driver-details-panel";
import { TrackingInsightsPanel } from "./tracking-insights-panel";
import { TrackingQuickActions } from "./tracking-quick-actions";
import {
  TrackingCommandLayout,
  TrackingMapFrame,
} from "./tracking-shell";
import {
  TrackingMapLegend,
  TrackingMapToolbar,
  TrackingSelectedDriverPopup,
  type MapLayerToggle,
} from "./tracking-map-overlays";
import {
  LEGEND_FILTERABLE_STATUSES,
  fleetStatusFromLocation,
  type FleetStatusKey,
} from "./tracking-status";
import type { LiveDriverMeta } from "./live-tracking-types";
import type { GeofenceMapOverlay } from "@/features/locations/geofence-map-overlays";
import { buildTrackingMapStyles } from "./tracking-map-google-styles";
import {
  DEFAULT_TRACKING_MAP_PREFS,
  loadTrackingMapPrefs,
  saveTrackingMapPrefs,
  type TrackingMapLayerPrefs,
} from "./tracking-map-layer-prefs";
import { cn } from "@/lib/utils";

export function LiveTrackingLiveView({ fullscreen }: { fullscreen?: boolean }) {
  const t = useTranslations("pages.liveTracking");
  const { locations } = useDriverLocationsRealtime();
  const [filters, setFilters] = useState<LiveTrackingFilterState>(DEFAULT_LIVE_TRACKING_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerToggle>("live");
  const [geofencesEnabled, setGeofencesEnabled] = useState(false);
  const [clusterCount, setClusterCount] = useState(0);
  const [mapOnlyFullscreen, setMapOnlyFullscreen] = useState(false);
  const [mapPrefs, setMapPrefs] = useState<TrackingMapLayerPrefs>(DEFAULT_TRACKING_MAP_PREFS);
  const [visibleStatuses, setVisibleStatuses] = useState<FleetStatusKey[]>(
    LEGEND_FILTERABLE_STATUSES,
  );
  const [mapActions, setMapActions] = useState<{
    recenter: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  } | null>(null);

  useEffect(() => {
    setMapPrefs(loadTrackingMapPrefs());
  }, []);

  const { data: driversMeta = [] } = useQuery({
    queryKey: queryKeys.drivers.list({ archived: false }),
    queryFn: () => fetchDriversForAdmin({ archived: false }),
  });

  const { data: zones = [] } = useQuery({
    queryKey: queryKeys.zones.list(),
    queryFn: fetchZones,
  });

  const profileMeta = useMemo(() => {
    const map = new Map<string, LiveDriverMeta>();
    for (const row of driversMeta) {
      if (!row.linked_profile_id) continue;
      map.set(row.linked_profile_id, {
        zoneId: row.zone_id ?? null,
        partnerId: row.partner_id ?? null,
        zoneName: row.zone_name ?? null,
        partnerName: row.partner_name ?? null,
        intakeId: row.id,
        phone: row.phone ?? null,
        detailHref: `/drivers/${row.id}?tab=location`,
      });
    }
    return map;
  }, [driversMeta]);

  const filtered = useMemo(() => {
    return locations.filter((loc) => {
      const meta = profileMeta.get(loc.driverId);
      if (!matchesLiveTrackingFilters(loc, filters, meta)) return false;
      const status = fleetStatusFromLocation({
        pinStatus: loc.pinStatus,
        trackingStatus: loc.trackingStatus,
        isOnDuty: loc.isOnDuty,
      });
      return visibleStatuses.includes(status);
    });
  }, [locations, filters, profileMeta, visibleStatuses]);

  const selectedDriver = useMemo(
    () => filtered.find((d) => d.driverId === selectedId) ?? locations.find((d) => d.driverId === selectedId) ?? null,
    [filtered, locations, selectedId],
  );

  const selectedMeta = selectedDriver ? profileMeta.get(selectedDriver.driverId) : undefined;

  const alertsCount = useMemo(
    () => locations.filter((l) => l.pinStatus === "alert").length,
    [locations],
  );

  const mapMarkers = useMemo(
    () =>
      filtered.map((loc) => ({
        id: loc.driverId,
        lat: loc.latitude,
        lng: loc.longitude,
        title: loc.driverName,
        pinStatus: loc.pinStatus,
        trackingStatus: loc.trackingStatus,
        heading: loc.heading,
        highlight: loc.driverId === selectedId,
      })),
    [filtered, selectedId],
  );

  const inProgressCount = useMemo(
    () => locations.filter((loc) => loc.trackingStatus === "delivery_submit").length,
    [locations],
  );

  const geofenceOverlays = useMemo((): GeofenceMapOverlay[] => {
    if (!geofencesEnabled) return [];
    return zones
      .filter((z) => z.geometry && z.status !== "inactive")
      .map((z) => ({
        id: z.id,
        zone_type: z.zone_type,
        geometry: z.geometry!,
        geofence_kind: z.geofence_kind,
        color: normalizeZoneColor(z.color),
        status: z.status,
      }));
  }, [zones, geofencesEnabled]);

  const mapHeightClass = fullscreen || mapOnlyFullscreen ? "min-h-0 flex-1 h-full" : "min-h-[560px] flex-1";

  const zoneFilterOptions = useMemo(
    () => [
      { id: "all", label: t("allZones") },
      ...zones.map((zone) => ({ id: zone.id, label: zone.name })),
    ],
    [t, zones],
  );

  const partnerFilterOptions = useMemo(() => {
    const uniq = new Map<string, string>();
    for (const row of driversMeta) {
      if (!row.partner_id || !row.partner_name) continue;
      uniq.set(row.partner_id, row.partner_name);
    }
    return [{ id: "all", label: t("allPartners") }, ...Array.from(uniq, ([id, label]) => ({ id, label }))];
  }, [driversMeta, t]);

  return (
    <TrackingCommandLayout
      fullscreen={fullscreen}
      left={
        <FleetOverviewPanel
          totalDrivers={driversMeta.length}
          trackedCount={locations.length}
          inProgressCount={inProgressCount}
          alertsCount={alertsCount}
          drivers={filtered}
          selectedDriverId={selectedId}
          onSelectDriver={setSelectedId}
          filters={filters}
          onChange={setFilters}
          zoneOptions={zoneFilterOptions}
          partnerOptions={partnerFilterOptions}
        />
      }
      center={
        <TrackingMapFrame
          mapHeightClass={mapHeightClass}
          className={cn(
            mapOnlyFullscreen && "fixed inset-2 z-50 rounded-xl border bg-background shadow-2xl",
          )}
        >
          <DriverLocationsMap
            markers={mapMarkers}
            geofenceOverlays={geofenceOverlays}
            fitToMarkers={filtered.length > 0}
            focusMarkerId={selectedId}
            onMarkerSelect={setSelectedId}
            mapHeightClass="h-full min-h-[480px]"
            frameless
            className="h-full rounded-none border-0"
            mapStyles={buildTrackingMapStyles(mapPrefs.hideLabels)}
            mapTypeId={mapPrefs.mapTypeId}
            defaultZoom={11}
            initialFitPadding={86}
            mapLayer={mapLayer}
            onMapActionsReady={setMapActions}
            onClusterCountChange={setClusterCount}
          />
          <TrackingMapToolbar
            activeLayer={mapLayer}
            onLayerChange={setMapLayer}
            geofencesEnabled={geofencesEnabled}
            onToggleGeofences={() => setGeofencesEnabled((prev) => !prev)}
            onRecenter={() => mapActions?.recenter()}
            onMapFullscreen={() => setMapOnlyFullscreen((prev) => !prev)}
            onZoomIn={() => mapActions?.zoomIn()}
            onZoomOut={() => mapActions?.zoomOut()}
            prefs={mapPrefs}
            onPrefsChange={(next) => {
              setMapPrefs(next);
              saveTrackingMapPrefs(next);
            }}
            onToggleTraffic={(enabled) => setMapLayer(enabled ? "traffic" : "live")}
          />
          <TrackingMapLegend
            activeStatuses={visibleStatuses}
            onToggleStatus={(status) => {
              setVisibleStatuses((prev) => {
                if (prev.includes(status)) return prev.filter((item) => item !== status);
                return [...prev, status];
              });
            }}
            clusterCount={clusterCount}
          />
          {selectedDriver ? (
            <TrackingSelectedDriverPopup
              driver={selectedDriver}
              meta={selectedMeta}
            />
          ) : null}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 grid gap-2 md:grid-cols-2">
            <div className="pointer-events-auto">
              <TrackingInsightsPanel drivers={locations} />
            </div>
            <div className="pointer-events-auto">
              <TrackingQuickActions />
            </div>
          </div>
        </TrackingMapFrame>
      }
      right={
        <LiveDriverDetailsPanel driver={selectedDriver} meta={selectedMeta} />
      }
    />
  );
}
