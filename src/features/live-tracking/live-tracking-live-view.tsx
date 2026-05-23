"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { DriverLocationsMap } from "@/features/locations/driver-locations-map";
import { useDriverLocationsRealtime } from "@/features/locations/use-driver-locations-realtime";
import { fetchDriversForAdmin } from "@/features/drivers/drivers-actions";
import { fetchZones } from "@/features/zones/use-zones";
import { fetchPartners } from "@/features/partners/use-partners";
import { queryKeys } from "@/lib/query/query-keys";
import { LiveDriverList } from "./live-driver-list";
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
  TrackingGlassCard,
  TrackingMapFrame,
} from "./tracking-shell";
import {
  TrackingMapLegend,
  TrackingMapToolbar,
  TrackingSelectedDriverPopup,
  type MapLayerToggle,
} from "./tracking-map-overlays";
import type { LiveDriverMeta } from "./live-tracking-types";
import {
  geofenceOverlayColor,
  type GeofenceMapOverlay,
} from "@/features/locations/geofence-map-overlays";

export function LiveTrackingLiveView({ fullscreen }: { fullscreen?: boolean }) {
  const t = useTranslations("pages.liveTracking");
  const { locations, isLoading } = useDriverLocationsRealtime();
  const [filters, setFilters] = useState<LiveTrackingFilterState>(DEFAULT_LIVE_TRACKING_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerToggle>("live");
  const geofencesEnabled = mapLayer === "geofences";

  const { data: driversMeta = [] } = useQuery({
    queryKey: queryKeys.drivers.list({ archived: false }),
    queryFn: () => fetchDriversForAdmin({ archived: false }),
  });

  const { data: zones = [] } = useQuery({
    queryKey: queryKeys.zones.list(),
    queryFn: fetchZones,
  });

  const { data: partners = [] } = useQuery({
    queryKey: queryKeys.partners.list(),
    queryFn: fetchPartners,
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
      return matchesLiveTrackingFilters(loc, filters, meta);
    });
  }, [locations, filters, profileMeta]);

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

  const geofenceOverlays = useMemo((): GeofenceMapOverlay[] => {
    if (!geofencesEnabled) return [];
    return zones
      .filter((z) => z.geometry && z.status !== "inactive")
      .map((z) => ({
        id: z.id,
        zone_type: z.zone_type,
        geometry: z.geometry!,
        geofence_kind: z.geofence_kind,
        color: geofenceOverlayColor(z.geofence_kind),
        status: z.status,
      }));
  }, [zones, geofencesEnabled]);

  const zoneOptions = useMemo(
    () => zones.map((z) => ({ id: z.id, name: z.name })),
    [zones],
  );

  const partnerOptions = useMemo(
    () => partners.map((p) => ({ id: p.id, name: p.name })),
    [partners],
  );

  const mapHeightClass = fullscreen
    ? "min-h-0 flex-1 h-full"
    : "min-h-[560px] flex-1";

  return (
    <TrackingCommandLayout
      fullscreen={fullscreen}
      left={
        <>
          <FleetOverviewPanel
            totalDrivers={driversMeta.length}
            trackedCount={locations.length}
            alertsCount={alertsCount}
            filters={filters}
            onChange={setFilters}
            zoneOptions={zoneOptions}
            partnerOptions={partnerOptions}
          />
          <TrackingGlassCard className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
              {t("trackedCount", { count: filtered.length })}
            </p>
            <div className="min-h-0 flex-1 overflow-hidden">
              {isLoading && locations.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("noLiveData")}
                </p>
              ) : (
                <LiveDriverList
                  drivers={filtered}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </TrackingGlassCard>
        </>
      }
      center={
        <>
          <TrackingMapFrame mapHeightClass={mapHeightClass}>
            <DriverLocationsMap
              markers={mapMarkers}
              geofenceOverlays={geofenceOverlays}
              fitToMarkers={filtered.length > 0 && !geofencesEnabled}
              focusMarkerId={selectedId}
              onMarkerSelect={setSelectedId}
              mapHeightClass="h-full min-h-[480px]"
              frameless
              className="h-full rounded-none border-0"
            />
            <TrackingMapToolbar
              activeLayer={mapLayer}
              onLayerChange={setMapLayer}
              geofencesEnabled={geofencesEnabled}
            />
            <TrackingMapLegend />
            {selectedDriver ? (
              <TrackingSelectedDriverPopup
                driver={selectedDriver}
                meta={selectedMeta}
              />
            ) : null}
          </TrackingMapFrame>
          <div className="grid gap-3 md:grid-cols-2">
            <TrackingInsightsPanel drivers={locations} />
            <TrackingQuickActions />
          </div>
        </>
      }
      right={
        <LiveDriverDetailsPanel driver={selectedDriver} meta={selectedMeta} />
      }
    />
  );
}
