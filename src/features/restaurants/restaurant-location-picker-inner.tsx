"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_ZOOM,
  getZoneMapTileProps,
  KUWAIT_MAP_CENTER,
} from "@/features/zones/constants";
import type { RestaurantLocation } from "./restaurant-location-utils";

const pinIcon = L.divIcon({
  className: "restaurant-map-pin",
  html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#EF5B4D;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></span>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({
  location,
  defaultCenter,
}: {
  location: RestaurantLocation | null;
  defaultCenter: [number, number];
}) {
  const map = useMap();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const key = location
      ? `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
      : "none";
    if (prev.current === key) return;
    prev.current = key;

    if (location) {
      map.flyTo([location.lat, location.lng], 16, { duration: 0.6 });
    } else {
      map.flyTo(defaultCenter, DEFAULT_MAP_ZOOM, { duration: 0.6 });
    }
  }, [location, defaultCenter, map]);

  return null;
}

function DraggableMarker({
  location,
  onChange,
}: {
  location: RestaurantLocation;
  onChange: (next: RestaurantLocation | null) => void;
}) {
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={pinIcon}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onChange({ lat, lng });
        },
      }}
    />
  );
}

export function RestaurantLocationPickerInner({
  value,
  onChange,
  defaultCenter = KUWAIT_MAP_CENTER,
  className,
}: {
  value: RestaurantLocation | null;
  onChange: (next: RestaurantLocation | null) => void;
  defaultCenter?: [number, number];
  className?: string;
}) {
  const tiles = useMemo(() => getZoneMapTileProps(), []);
  const center = value ? [value.lat, value.lng] as [number, number] : defaultCenter;

  const handlePick = (lat: number, lng: number) => {
    onChange({ lat, lng });
  };

  return (
    <MapContainer
      center={center}
      zoom={value ? 16 : DEFAULT_MAP_ZOOM}
      className={className ?? "h-full w-full"}
      zoomControl={false}
    >
      <TileLayer url={tiles.url} attribution={tiles.attribution} />
      <ZoomControl position="bottomright" />
      <MapClickHandler onPick={handlePick} />
      <FlyToLocation location={value} defaultCenter={defaultCenter} />
      {value ? (
        <DraggableMarker location={value} onChange={onChange} />
      ) : null}
    </MapContainer>
  );
}
