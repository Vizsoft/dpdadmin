import type {
  ZoneGeoFeature,
  ZoneGeometryType,
} from "@/lib/geo/zone-geometry";
import type { RestaurantStatus } from "./restaurant-status";

export type { RestaurantStatus };

export type RestaurantGeofenceKind = "inclusion" | "exclusion";

export type RestaurantRow = {
  id: string;
  partner_id: string | null;
  partner_name: string;
  zone_id: string | null;
  zone_name: string;
  name: string;
  logo_url: string | null;
  logo_display_url: string | null;
  external_merchant_id: string | null;
  map_link: string | null;
  latitude: number | null;
  longitude: number | null;
  status: RestaurantStatus;
  is_active: boolean;
  driver_count: number;
  created_at: string;
};

export type RestaurantPartnerOption = {
  id: string;
  name: string;
};

export type RestaurantZoneOption = {
  id: string;
  name: string;
  code: string;
};

export type RestaurantGeofence = {
  id: string;
  restaurant_id: string;
  kind: RestaurantGeofenceKind;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature;
  name: string | null;
  color: string;
  created_at: string;
};

/** Client-side geofence row (temp id allowed before first save). */
export type RestaurantGeofenceDraft = {
  id: string;
  kind: RestaurantGeofenceKind;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature;
  name: string | null;
  color: string;
};

export type RestaurantGeofenceInput = {
  id?: string;
  kind: RestaurantGeofenceKind;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature;
  name?: string | null;
  color?: string;
};
