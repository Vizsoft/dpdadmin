import type { ZoneGeoFeature, ZoneGeometryType } from "@/lib/geo/zone-geometry";

export type ZoneRow = {
  id: string;
  name: string;
  code: string;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature | null;
  created_at: string;
  driver_count: number;
};

export type ZoneDriverRow = {
  id: string;
  driver_code: string;
  full_name: string | null;
  partner_name: string | null;
  partner_logo_url: string | null;
};

export type ZoneFormValues = {
  name: string;
  code: string;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature | null;
};
