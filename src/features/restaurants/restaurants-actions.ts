"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import {
  canManageRestaurants,
  canViewRestaurants,
} from "@/lib/auth/permissions";
import { isRestaurantErrorKey, type RestaurantErrorKey } from "./restaurant-errors";
import {
  parseRestaurantFormData,
  validateRestaurantCoordinates,
} from "./parse-restaurant-form";
import type {
  RestaurantPartnerOption,
  RestaurantRow,
  RestaurantZoneOption,
} from "./types";

export type RestaurantMutationResult = {
  error?: RestaurantErrorKey | string;
  success?: boolean;
  id?: string;
};

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  const msg = error.message ?? "";
  return msg.includes("driver_intake_restaurants") || msg.includes("driver_restaurants");
}

async function requireRestaurantsView() {
  const session = await getSessionUser();
  if (!session || !canViewRestaurants(session.permissions, session.isSuperAdmin)) {
    throw new Error("not_authorized");
  }
  return session;
}

async function requireRestaurantsManage() {
  const session = await getSessionUser();
  if (!session || !canManageRestaurants(session.permissions, session.isSuperAdmin)) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

export async function fetchRestaurantPartnerOptions(): Promise<RestaurantPartnerOption[]> {
  await requireRestaurantsView();
  const supabase = await createClient();
  const { data, error } = await supabase.from("partners").select("id, name").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRestaurantZoneOptions(): Promise<RestaurantZoneOption[]> {
  await requireRestaurantsView();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("id, name, code")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRestaurantsForAdmin(): Promise<RestaurantRow[]> {
  await requireRestaurantsView();
  const supabase = await createClient();

  const [{ data: restaurants, error }, { data: partners }, { data: zones }] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select(
          "id, partner_id, zone_id, name, external_merchant_id, map_link, latitude, longitude, status, is_active, created_at",
        )
        .order("name"),
      supabase.from("partners").select("id, name"),
      supabase.from("zones").select("id, name, code"),
    ]);

  if (error) throw error;

  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]));
  const zoneMap = new Map(
    (zones ?? []).map((z) => [z.id, `${z.name} (${z.code})`]),
  );
  const ids = (restaurants ?? []).map((r) => r.id);

  const driverCounts = new Map<string, number>();
  if (ids.length > 0) {
    const [{ data: intakeLinks, error: intakeErr }, { data: driverLinks, error: driverErr }] =
      await Promise.all([
        supabase
          .from("driver_intake_restaurants")
          .select("restaurant_id, intake_id")
          .in("restaurant_id", ids),
        supabase
          .from("driver_restaurants")
          .select("restaurant_id, driver_id")
          .in("restaurant_id", ids),
      ]);

    if (!isMissingRelationError(intakeErr) && !isMissingRelationError(driverErr)) {
      const seen = new Map<string, Set<string>>();
      for (const row of intakeLinks ?? []) {
        const set = seen.get(row.restaurant_id) ?? new Set();
        set.add(`intake:${row.intake_id}`);
        seen.set(row.restaurant_id, set);
      }
      for (const row of driverLinks ?? []) {
        const set = seen.get(row.restaurant_id) ?? new Set();
        set.add(`driver:${row.driver_id}`);
        seen.set(row.restaurant_id, set);
      }
      for (const [restaurantId, set] of seen) {
        driverCounts.set(restaurantId, set.size);
      }
    }
  }

  return (restaurants ?? []).map((row) => ({
    id: row.id,
    partner_id: row.partner_id,
    partner_name: partnerMap.get(row.partner_id) ?? "—",
    zone_id: row.zone_id,
    zone_name: row.zone_id ? (zoneMap.get(row.zone_id) ?? "—") : "—",
    name: row.name,
    external_merchant_id: row.external_merchant_id,
    map_link: row.map_link,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    status: row.status,
    is_active: row.is_active,
    driver_count: driverCounts.get(row.id) ?? 0,
    created_at: row.created_at,
  }));
}

export async function saveRestaurant(formData: FormData): Promise<RestaurantMutationResult> {
  const auth = await requireRestaurantsManage();
  if (auth.error) return { error: auth.error };

  const parsed = parseRestaurantFormData(formData);
  const {
    id,
    partnerId,
    zoneId,
    name,
    externalMerchantId,
    mapLink,
    status,
    isActive,
    latitude,
    longitude,
  } = parsed;

  if (!partnerId || !zoneId || !name) return { error: "missing_fields" };

  const coordError = validateRestaurantCoordinates(latitude, longitude);
  if (coordError) return { error: coordError };

  const supabase = await createClient();
  const payload = {
    partner_id: partnerId,
    zone_id: zoneId,
    name,
    external_merchant_id: externalMerchantId || null,
    map_link: mapLink || null,
    latitude,
    longitude,
    status,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("restaurants").update(payload).eq("id", id);
    if (error) {
      if (error.code === "23505") return { error: "restaurant_exists" };
      return { error: "save_failed" };
    }
    return { success: true, id };
  }

  const insertPayload = {
    ...payload,
    created_by: auth.session.id,
  };

  const { data, error } = await supabase
    .from("restaurants")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "restaurant_exists" };
    return { error: "save_failed" };
  }

  return { success: true, id: data.id };
}

export async function deleteRestaurant(id: string): Promise<RestaurantMutationResult> {
  const auth = await requireRestaurantsManage();
  if (auth.error) return { error: auth.error };
  if (!id) return { error: "missing_fields" };

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) return { error: "delete_failed" };
  return { success: true };
}

export { isRestaurantErrorKey };
