"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import {
  suggestZoneCode,
  validateZoneGeometry,
  type ZoneGeoFeature,
  type ZoneGeometryType,
} from "@/lib/geo/zone-geometry";
import type { Json } from "@/types/database";

async function requireZonesManager() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "zones.manage", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

export type ZoneMutationResult = { error?: string; success?: boolean; id?: string };

export async function createZone(input: {
  name: string;
  code: string;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature;
}): Promise<ZoneMutationResult> {
  const auth = await requireZonesManager();
  if ("error" in auth) return auth;

  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!name || !code) return { error: "missing_fields" };

  const geometryError = validateZoneGeometry(input.zone_type, input.geometry);
  if (geometryError) return { error: geometryError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .insert({
      name,
      code,
      zone_type: input.zone_type,
      geometry: input.geometry as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "code_exists" };
    return { error: error.message };
  }

  return { success: true, id: data.id };
}

export async function updateZone(input: {
  id: string;
  name: string;
  code: string;
  zone_type: ZoneGeometryType;
  geometry: ZoneGeoFeature;
}): Promise<ZoneMutationResult> {
  const auth = await requireZonesManager();
  if ("error" in auth) return auth;

  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!name || !code) return { error: "missing_fields" };

  const geometryError = validateZoneGeometry(input.zone_type, input.geometry);
  if (geometryError) return { error: geometryError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("zones")
    .update({
      name,
      code,
      zone_type: input.zone_type,
      geometry: input.geometry as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    if (error.code === "23505") return { error: "code_exists" };
    return { error: error.message };
  }

  return { success: true, id: input.id };
}

export async function deleteZone(id: string, force = false): Promise<ZoneMutationResult> {
  const auth = await requireZonesManager();
  if ("error" in auth) return auth;

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("drivers")
    .select("id", { count: "exact", head: true })
    .eq("zone_id", id);

  if (countError) return { error: countError.message };

  if (!force && (count ?? 0) > 0) return { error: "has_drivers" };

  if (force && (count ?? 0) > 0) {
    const { error: unassignError } = await supabase
      .from("drivers")
      .update({ zone_id: null })
      .eq("zone_id", id);
    if (unassignError) return { error: unassignError.message };
  }

  const { error } = await supabase.from("zones").delete().eq("id", id);
  if (error) return { error: error.message };

  return { success: true };
}

export async function generateZoneCode(): Promise<{ code: string }> {
  return { code: suggestZoneCode() };
}
