"use server";

import { logAdminRead } from "@/lib/audit/log-admin-activity";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import {
  enrichLiveLocation,
  parseTrackingStatus,
  parseZoneStatus,
} from "./location-status";
import type { DriverLiveLocation, DriverLocationEvent } from "./types";

async function requireDriversView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "drivers.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }
  return session;
}

function restaurantFromDriver(
  driver: {
    driver_restaurants?: Array<{
      restaurants: { name: string } | { name: string }[] | null;
    }> | null;
  } | null,
): string | null {
  const link = driver?.driver_restaurants?.[0];
  if (!link) return null;
  const rest = link.restaurants;
  const row = Array.isArray(rest) ? rest[0] : rest;
  return row?.name ?? null;
}

function mapLiveRow(row: {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed_mps: number | null;
  distance_today_meters: number | null;
  accuracy_meters: number | null;
  battery_pct: number | null;
  heading_deg: number | null;
  tracking_status: string;
  zone_status: string | null;
  last_seen_at: string;
  updated_at: string;
  drivers: {
    driver_code: string;
    employee_id: string | null;
    is_on_duty: boolean;
    profiles: { full_name: string | null } | { full_name: string | null }[] | null;
    driver_restaurants?: Array<{
      restaurants: { name: string } | { name: string }[] | null;
    }>;
  } | null;
}): DriverLiveLocation {
  const driver = row.drivers;
  const profile = driver?.profiles;
  const profileRow = Array.isArray(profile) ? profile[0] : profile;

  return enrichLiveLocation({
    driverId: row.driver_id,
    driverName: profileRow?.full_name?.trim() || driver?.driver_code || row.driver_id.slice(0, 8),
    driverCode: driver?.driver_code ?? "—",
    employeeId: driver?.employee_id ?? null,
    isOnDuty: driver?.is_on_duty ?? false,
    restaurantName: restaurantFromDriver(driver),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    speedMps: row.speed_mps != null ? Number(row.speed_mps) : null,
    distanceTodayMeters:
      row.distance_today_meters != null ? Number(row.distance_today_meters) : 0,
    accuracyMeters: row.accuracy_meters != null ? Number(row.accuracy_meters) : null,
    batteryPct: row.battery_pct,
    heading: row.heading_deg != null ? Number(row.heading_deg) : null,
    trackingStatus: parseTrackingStatus(row.tracking_status),
    zoneStatus: parseZoneStatus(row.zone_status),
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at,
  });
}

export async function fetchLiveDriverLocations(): Promise<DriverLiveLocation[]> {
  await requireDriversView();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("driver_locations")
    .select(
      `
      driver_id,
      latitude,
      longitude,
      speed_mps,
      distance_today_meters,
      accuracy_meters,
      battery_pct,
      heading_deg,
      tracking_status,
      zone_status,
      last_seen_at,
      updated_at,
      drivers (
        driver_code,
        employee_id,
        is_on_duty,
        profiles ( full_name ),
        driver_restaurants (
          restaurants ( name )
        )
      )
    `,
    )
    .order("last_seen_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  void logAdminRead("driver_locations", "locations.fetchLive");

  return (data ?? []).map((row) => mapLiveRow(row as Parameters<typeof mapLiveRow>[0]));
}

export async function fetchDriverLocationHistory(
  driverId: string,
  fromIso: string,
  toIso: string,
): Promise<DriverLocationEvent[]> {
  await requireDriversView();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("driver_location_events")
    .select(
      "id, driver_id, latitude, longitude, speed_mps, accuracy_meters, battery_pct, tracking_status, zone_status, delivery_id, recorded_at",
    )
    .eq("driver_id", driverId)
    .gte("recorded_at", fromIso)
    .lte("recorded_at", toIso)
    .order("recorded_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  await logAdminRead("driver_location_events", "locations.fetchHistory", { driverId });

  return (data ?? []).map((row) => ({
    id: row.id,
    driverId: row.driver_id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    speedMps: row.speed_mps != null ? Number(row.speed_mps) : null,
    accuracyMeters: row.accuracy_meters != null ? Number(row.accuracy_meters) : null,
    batteryPct: row.battery_pct,
    trackingStatus: parseTrackingStatus(row.tracking_status),
    zoneStatus: parseZoneStatus(row.zone_status),
    deliveryId: row.delivery_id,
    recordedAt: row.recorded_at,
  }));
}

const KUWAIT_TZ = "Asia/Kuwait";

function kuwaitDateFromIso(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KUWAIT_TZ }).format(new Date(iso));
}

function monthIsoBounds(yearMonth: string): { from: string; to: string } {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const lastDay = new Date(year, month, 0).getDate();
  const monthPadded = String(month).padStart(2, "0");
  return {
    from: `${yearStr}-${monthPadded}-01T00:00:00+03:00`,
    to: `${yearStr}-${monthPadded}-${String(lastDay).padStart(2, "0")}T23:59:59.999+03:00`,
  };
}

export async function fetchDriverHistoryActiveDates(
  driverId: string,
  yearMonth: string,
): Promise<string[]> {
  await requireDriversView();
  const supabase = await createClient();
  const { from, to } = monthIsoBounds(yearMonth);

  const { data, error } = await supabase
    .from("driver_location_events")
    .select("recorded_at")
    .eq("driver_id", driverId)
    .gte("recorded_at", from)
    .lte("recorded_at", to);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminRead("driver_location_events", "locations.fetchHistoryDates", { driverId });

  const dates = new Set<string>();
  for (const row of data ?? []) {
    dates.add(kuwaitDateFromIso(row.recorded_at));
  }
  return Array.from(dates).sort();
}

export async function fetchLocationEventByDeliveryId(
  deliveryId: string,
): Promise<DriverLocationEvent | null> {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "deliveries.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("driver_location_events")
    .select(
      "id, driver_id, latitude, longitude, speed_mps, accuracy_meters, battery_pct, tracking_status, zone_status, delivery_id, recorded_at",
    )
    .eq("delivery_id", deliveryId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    driverId: data.driver_id,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    speedMps: data.speed_mps != null ? Number(data.speed_mps) : null,
    accuracyMeters: data.accuracy_meters != null ? Number(data.accuracy_meters) : null,
    batteryPct: data.battery_pct,
    trackingStatus: parseTrackingStatus(data.tracking_status),
    zoneStatus: parseZoneStatus(data.zone_status),
    deliveryId: data.delivery_id,
    recordedAt: data.recorded_at,
  };
}

export async function fetchTrackedDriverCount(): Promise<number> {
  await requireDriversView();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("driver_locations")
    .select("driver_id", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}
