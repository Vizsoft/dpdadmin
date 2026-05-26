"use server";

import { logAdminMutation, logAdminRead } from "@/lib/audit/log-admin-activity";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import {
  canManageRestaurants,
  canViewRestaurants,
} from "@/lib/auth/permissions";
import {
  applyRestaurantLogoFromForm,
  deleteRestaurantLogoFiles,
} from "./restaurant-logo-storage";
import {
  parseRestaurantFormData,
  validateRestaurantCoordinates,
} from "./parse-restaurant-form";
import { resolveRestaurantLogoUrls } from "@/lib/storage/restaurant-logo-url";
import {
  validateZoneGeometry,
  type ZoneGeoFeature,
  type ZoneGeometryType,
} from "@/lib/geo/zone-geometry";
import type { Json } from "@/types/database";
import type {
  RestaurantGeofence,
  RestaurantGeofenceInput,
  RestaurantGeofenceKind,
  RestaurantGeofenceMutationResult,
  RestaurantMutationResult,
  RestaurantPartnerOption,
  RestaurantRow,
  RestaurantZoneOption,
} from "./types";

type PgLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function formatPgErrorDetail(
  error: PgLikeError | null | undefined,
): string | undefined {
  if (!error) return undefined;
  const parts: string[] = [];
  if (error.code) parts.push(`code ${error.code}`);
  if (error.message) parts.push(error.message);
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(`hint: ${error.hint}`);
  return parts.length > 0 ? parts.join(" — ") : undefined;
}

function logPgError(scope: string, error: PgLikeError | unknown): void {
  const e = error as PgLikeError;
  console.error(`[restaurants:${scope}]`, {
    code: e?.code ?? null,
    message: e?.message ?? null,
    details: e?.details ?? null,
    hint: e?.hint ?? null,
  });
}

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
  void logAdminRead("restaurants", "fetchRestaurantsForAdmin");
  const supabase = await createClient();

  const [
    { data: restaurants, error: restaurantsError },
    { data: partners, error: partnersError },
    { data: zones, error: zonesError },
  ] = await Promise.all([
    supabase
      .from("restaurants")
      .select(
        "id, partner_id, zone_id, name, logo_url, external_merchant_id, map_link, latitude, longitude, status, is_active, created_at",
      )
      .order("name"),
    supabase.from("partners").select("id, name"),
    supabase.from("zones").select("id, name, code"),
  ]);

  if (restaurantsError) {
    logPgError("list", restaurantsError);
    throw restaurantsError;
  }
  if (partnersError) logPgError("list_partners", partnersError);
  if (zonesError) logPgError("list_zones", zonesError);

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

  const rows = (restaurants ?? []).map((row) => ({
    id: row.id,
    partner_id: row.partner_id,
    partner_name: row.partner_id ? (partnerMap.get(row.partner_id) ?? "—") : "—",
    zone_id: row.zone_id,
    zone_name: row.zone_id ? (zoneMap.get(row.zone_id) ?? "—") : "—",
    name: row.name,
    logo_url: row.logo_url,
    external_merchant_id: row.external_merchant_id,
    map_link: row.map_link,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    status: row.status,
    is_active: row.is_active,
    driver_count: driverCounts.get(row.id) ?? 0,
    created_at: row.created_at,
  }));

  try {
    return await resolveRestaurantLogoUrls(rows);
  } catch (error) {
    logPgError("logo_urls", error);
    return rows.map((row) => ({ ...row, logo_display_url: null }));
  }
}

export async function fetchRestaurantPickerOptions(): Promise<
  Array<{
    id: string;
    name: string;
    partner_id: string | null;
    partner_name: string | null;
    status: RestaurantRow["status"];
  }>
> {
  await requireRestaurantsView();
  const supabase = await createClient();
  const [{ data: restaurants, error }, { data: partners, error: partnersError }] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, partner_id, status")
        .order("name"),
      supabase.from("partners").select("id, name"),
    ]);

  if (error) {
    logPgError("picker", error);
    throw error;
  }
  if (partnersError) logPgError("picker_partners", partnersError);

  const partnerNameById = new Map((partners ?? []).map((p) => [p.id, p.name]));

  return (restaurants ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    partner_id: row.partner_id,
    partner_name: row.partner_id
      ? (partnerNameById.get(row.partner_id) ?? null)
      : null,
    status: row.status,
  }));
}

function validateGeofenceInput(
  input: RestaurantGeofenceInput,
): string | null {
  if (input.kind !== "inclusion" && input.kind !== "exclusion") {
    return "invalid_kind";
  }
  return validateZoneGeometry(input.zone_type, input.geometry);
}

function mapGeofenceRow(row: {
  id: string;
  restaurant_id: string;
  kind: string;
  zone_type: string;
  geometry: Json;
  name: string | null;
  color: string;
  created_at: string;
}): RestaurantGeofence {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    kind: row.kind as RestaurantGeofenceKind,
    zone_type: row.zone_type as ZoneGeometryType,
    geometry: row.geometry as unknown as ZoneGeoFeature,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
  };
}

export async function fetchRestaurantGeofences(
  restaurantId: string,
): Promise<RestaurantGeofence[]> {
  await requireRestaurantsView();
  if (!restaurantId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_geofences")
    .select(
      "id, restaurant_id, kind, zone_type, geometry, name, color, created_at",
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map(mapGeofenceRow);
}

export async function saveRestaurantGeofences(
  restaurantId: string,
  geofences: RestaurantGeofenceInput[],
): Promise<RestaurantGeofenceMutationResult> {
  const auth = await requireRestaurantsManage();
  if (auth.error) return { error: auth.error };
  if (!restaurantId) return { error: "missing_fields" };

  for (const geofence of geofences) {
    const validationError = validateGeofenceInput(geofence);
    if (validationError) return { error: validationError };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("restaurant_geofences")
    .select("id")
    .eq("restaurant_id", restaurantId);

  if (fetchError) return { error: "save_failed" };

  const incomingIds = new Set(
    geofences.map((g) => g.id).filter((id): id is string => Boolean(id)),
  );
  const toDelete = (existing ?? [])
    .map((row) => row.id)
    .filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("restaurant_geofences")
      .delete()
      .in("id", toDelete);
    if (deleteError) return { error: "save_failed" };
  }

  for (const geofence of geofences) {
    const payload = {
      restaurant_id: restaurantId,
      kind: geofence.kind,
      zone_type: geofence.zone_type,
      geometry: geofence.geometry as unknown as Json,
      name: geofence.name?.trim() || null,
      color: geofence.color ?? (geofence.kind === "inclusion" ? "#22c55e" : "#ef4444"),
      updated_at: new Date().toISOString(),
    };

    if (geofence.id) {
      const { error } = await supabase
        .from("restaurant_geofences")
        .update(payload)
        .eq("id", geofence.id)
        .eq("restaurant_id", restaurantId);
      if (error) return { error: "save_failed" };
    } else {
      const { error } = await supabase.from("restaurant_geofences").insert({
        ...payload,
        created_by: auth.session.id,
      });
      if (error) return { error: "save_failed" };
    }
  }

  void logAdminMutation({
    action: "update",
    entityType: "restaurant",
    entityId: restaurantId,
    routeName: "saveRestaurantGeofences",
    after: { geofence_count: geofences.length },
  });

  return { success: true };
}

function hasValidCoordinates(
  latitude: number | null,
  longitude: number | null,
): boolean {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}

async function countInclusionGeofences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("restaurant_geofences")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("kind", "inclusion");
  if (error) {
    logPgError("count_inclusion_geofences", error);
    return 0;
  }
  return count ?? 0;
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
    status: requestedStatus,
    latitude,
    longitude,
    inclusionGeofenceCount,
  } = parsed;

  if (!name) return { error: "missing_fields" };

  const coordError = validateRestaurantCoordinates(latitude, longitude);
  if (coordError) return { error: coordError };

  const supabase = await createClient();

  let status = requestedStatus;
  let statusWarning: RestaurantMutationResult["statusWarning"];

  if (status === "published") {
    let hasInclusionGeofence = inclusionGeofenceCount > 0;
    if (!hasInclusionGeofence && id) {
      hasInclusionGeofence = (await countInclusionGeofences(supabase, id)) > 0;
    }
    const hasCoords = hasValidCoordinates(latitude, longitude);
    if (!hasCoords && !hasInclusionGeofence) {
      status = "draft";
      statusWarning = "auto_downgraded_to_draft";
    }
  }

  const isActive = status === "published";

  const payload = {
    partner_id: partnerId || null,
    zone_id: zoneId || null,
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
    const logoResult = await applyRestaurantLogoFromForm(id, formData, auth.session.id);
    const patch = {
      ...payload,
      ...(logoResult.logoUrl !== undefined ? { logo_url: logoResult.logoUrl } : {}),
    };
    const { error } = await supabase.from("restaurants").update(patch).eq("id", id);
    if (error) {
      if (error.code === "23505") return { error: "restaurant_exists" };
      logPgError("update", error);
      return { error: "save_failed", errorDetail: formatPgErrorDetail(error) };
    }
    void logAdminMutation({
      action: "update",
      entityType: "restaurant",
      entityId: id,
      routeName: "saveRestaurant",
      after: { name, partner_id: partnerId, zone_id: zoneId, status },
    });
    return {
      success: true,
      id,
      logoUrl: logoResult.logoUrl,
      logoWarning: logoResult.logoWarning,
      statusWarning,
      finalStatus: status,
    };
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
    logPgError("insert", error);
    return { error: "save_failed", errorDetail: formatPgErrorDetail(error) };
  }

  const logoResult = await applyRestaurantLogoFromForm(
    data.id,
    formData,
    auth.session.id,
  );
  if (logoResult.logoUrl !== undefined) {
    await supabase
      .from("restaurants")
      .update({
        logo_url: logoResult.logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }

  void logAdminMutation({
    action: "create",
    entityType: "restaurant",
    entityId: data.id,
    routeName: "saveRestaurant",
    after: { name, partner_id: partnerId, zone_id: zoneId, status },
  });

  return {
    success: true,
    id: data.id,
    logoUrl: logoResult.logoUrl,
    logoWarning: logoResult.logoWarning,
    statusWarning,
    finalStatus: status,
  };
}

export async function deleteRestaurant(id: string): Promise<RestaurantMutationResult> {
  const auth = await requireRestaurantsManage();
  if (auth.error) return { error: auth.error };
  if (!id) return { error: "missing_fields" };

  const supabase = await createClient();
  await deleteRestaurantLogoFiles(id);
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) return { error: "delete_failed" };
  void logAdminMutation({
    action: "delete",
    entityType: "restaurant",
    entityId: id,
    routeName: "deleteRestaurant",
  });
  return { success: true };
}
