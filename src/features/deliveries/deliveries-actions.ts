"use server";

import { logAdminMutation, logAdminRead } from "@/lib/audit/log-admin-activity";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { resolveOrderProofUrl } from "@/lib/storage/order-proof-url";
import { resolvePartnerLogoUrl } from "@/lib/storage/partner-logo-url";
import { deleteObject } from "@/lib/storage/r2-client";
import { isR2ObjectKey } from "@/lib/storage/r2-keys";
import type {
  DeliveryActionError,
  DeliveryListRow,
  DeliveryStatus,
  ReviewableDeliveryStatus,
} from "./types";
import { sortDeliveriesByActivity } from "./delivery-sort-utils";

type DeliveryMutationResult =
  | { ok: true }
  | { error: DeliveryActionError; errorDetail?: string };

type PgLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function formatPgErrorDetail(error: PgLikeError | null | undefined): string | undefined {
  if (!error) return undefined;
  const parts: string[] = [];
  if (error.code) parts.push(`code ${error.code}`);
  if (error.message) parts.push(error.message);
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(`hint: ${error.hint}`);
  return parts.length > 0 ? parts.join(" — ") : undefined;
}

async function requireDeliveriesView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "deliveries.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }
  return session;
}

async function requireDeliveriesManage() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "deliveries.manage", session.isSuperAdmin)
  ) {
    return null;
  }
  return session;
}

async function requireSuperAdmin() {
  const session = await getSessionUser();
  if (!session?.isSuperAdmin) return null;
  return session;
}

async function resolveDeliveryRestaurantId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    driver_id: string;
    partner_id: string | null;
    restaurant_id: string | null;
  },
): Promise<string | null> {
  if (input.restaurant_id) return input.restaurant_id;

  const { data: assigned } = await supabase
    .from("driver_restaurants")
    .select("restaurant_id")
    .eq("driver_id", input.driver_id)
    .limit(5);

  const assignedIds = (assigned ?? [])
    .map((row) => row.restaurant_id)
    .filter((id): id is string => Boolean(id));

  if (assignedIds.length === 1 && !input.partner_id) {
    return assignedIds[0];
  }

  if (assignedIds.length > 0 && input.partner_id) {
    const { data: matchedAssigned } = await supabase
      .from("restaurants")
      .select("id")
      .in("id", assignedIds)
      .eq("partner_id", input.partner_id)
      .limit(2);
    if ((matchedAssigned ?? []).length === 1) {
      return matchedAssigned![0]!.id;
    }
  }

  if (!input.partner_id) return null;

  const { data: partnerRestaurants } = await supabase
    .from("restaurants")
    .select("id")
    .eq("partner_id", input.partner_id)
    .order("created_at", { ascending: true })
    .limit(2);
  if ((partnerRestaurants ?? []).length === 1) {
    return partnerRestaurants![0]!.id;
  }

  return null;
}

function earnDateFromDeliveredAt(deliveredAt: string): string {
  const d = new Date(deliveredAt);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Keep DPD verification in sync after a delivery's status changes.
 *
 * When an admin approves (or moves out of) a delivery on the deliveries page
 * we want the DPD verification page to immediately reflect that admin's
 * decision instead of waiting for the restaurant to file a report. We:
 *
 *  1. Count the deliveries on the same Kuwait service-date for the same
 *     driver+restaurant (or driver+partner if the delivery has no restaurant
 *     attached) that are eligible to be matched (i.e. not rejected).
 *  2. Upsert a delivery_verifications row with `reported_count` set to that
 *     count so the trigger reconciles statuses on its own.
 *
 * Auto-created rows are tagged in `notes` so we never overwrite a
 * restaurant-reported figure once a human has entered one.
 */
async function syncVerificationForDelivery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  delivery: {
    id: string;
    driver_id: string;
    delivered_at: string;
    partner_id: string | null;
    restaurant_id: string | null;
  },
  actorId: string,
): Promise<void> {
  // We need at least a partner to scope the verification (verifications.partner_id
  // is NOT NULL). If the delivery has no partner, skip — there's nothing to
  // reconcile against.
  if (!delivery.partner_id) return;

  const serviceDate = earnDateFromDeliveredAt(delivery.delivered_at);

  // Resolve the restaurant we'll attach the verification to. If the delivery
  // has its own restaurant, use that; otherwise, fall back to a single
  // restaurant on the partner so we still have one to write to.
  const restaurantId = await resolveDeliveryRestaurantId(supabase, {
    driver_id: delivery.driver_id,
    partner_id: delivery.partner_id,
    restaurant_id: delivery.restaurant_id,
  });
  if (!restaurantId) return;

  // Count eligible deliveries for this driver+restaurant_or_partner+date.
  const startIso = `${serviceDate}T00:00:00+03:00`;
  const endIso = `${serviceDate}T23:59:59.999+03:00`;

  const { data: dayRows, error: countError } = await supabase
    .from("deliveries")
    .select("id, status, restaurant_id, partner_id")
    .eq("driver_id", delivery.driver_id)
    .gte("delivered_at", startIso)
    .lte("delivered_at", endIso);
  if (countError) {
    console.error("[syncVerificationForDelivery] count failed", countError);
    return;
  }

  const eligible = (dayRows ?? []).filter(
    (d) =>
      d.status !== "rejected" &&
      (d.restaurant_id === restaurantId ||
        (d.restaurant_id == null && d.partner_id === delivery.partner_id)),
  );
  const reported = eligible.length;

  // Look up an existing verification for the same key.
  const { data: existing } = await supabase
    .from("delivery_verifications")
    .select("id, source, reported_count, notes")
    .eq("driver_id", delivery.driver_id)
    .eq("restaurant_id", restaurantId)
    .eq("service_date", serviceDate)
    .maybeSingle();

  const AUTO_TAG = "[auto:delivery-approval]";

  if (existing) {
    const isAuto = (existing.notes ?? "").includes(AUTO_TAG);
    // Don't clobber a real restaurant report; just trigger a reconcile by
    // touching the row so the trigger re-runs.
    if (!isAuto) {
      await supabase
        .from("delivery_verifications")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      return;
    }
    if (existing.reported_count !== reported) {
      await supabase
        .from("delivery_verifications")
        .update({
          reported_count: reported,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
    return;
  }

  // No verification exists yet — create one tagged so future syncs know it's
  // safe to update the count.
  if (reported === 0) return;

  const { error: insertError } = await supabase
    .from("delivery_verifications")
    .insert({
      driver_id: delivery.driver_id,
      restaurant_id: restaurantId,
      partner_id: delivery.partner_id,
      service_date: serviceDate,
      reported_count: reported,
      notes: AUTO_TAG,
      source: "manual",
      created_by: actorId,
    });
  if (insertError && insertError.code !== "23505") {
    console.error("[syncVerificationForDelivery] insert failed", insertError);
  }
}

async function recalcEarningsForDelivery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  driverId: string,
  deliveredAt: string,
) {
  const earnDate = earnDateFromDeliveredAt(deliveredAt);
  await supabase.rpc("recalculate_driver_earnings", {
    p_driver_id: driverId,
    p_earn_date: earnDate,
  });
}

function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

function relName<T extends { name: string }>(
  rel: T | T[] | null | undefined,
): string {
  if (!rel) return "—";
  const row = Array.isArray(rel) ? rel[0] : rel;
  return row?.name ?? "—";
}

function parseCoord(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

type DeliveryDbRow = {
  id: string;
  driver_id: string;
  partner_id: string | null;
  restaurant_id: string | null;
  zone_id: string | null;
  external_order_id: string | null;
  order_proof_url: string | null;
  status: DeliveryStatus;
  rejection_reason: string | null;
  delivered_at: string | null;
  delivered_lat: number | null;
  delivered_lng: number | null;
  pickup_at: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pickup_proof_url: string | null;
  cancelled_at: string | null;
  cancel_lat: number | null;
  cancel_lng: number | null;
  cancel_reason: string | null;
  cancel_proof_url: string | null;
  created_at: string;
  drivers: {
    driver_code: string;
    profiles: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] | null;
  } | {
    driver_code: string;
    profiles: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] | null;
  }[] | null;
  partners: { name: string; logo_url: string | null } | { name: string; logo_url: string | null }[] | null;
  restaurants: { id: string; name: string } | { id: string; name: string }[] | null;
  zones: { name: string } | { name: string }[] | null;
};

type ProofResolved = { url: string; contentType: string | null } | null;

async function resolveProofCached(
  key: string,
  cache: Map<string, ProofResolved>,
): Promise<ProofResolved> {
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  const resolved = await resolveOrderProofUrl(key);
  const entry: ProofResolved = resolved
    ? { url: resolved.url, contentType: resolved.contentType }
    : null;
  cache.set(key, entry);
  return entry;
}

async function fetchGpsMockFlagsByDeliveryIds(
  deliveryIds: string[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (deliveryIds.length === 0) return result;

  const admin = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => Record<string, unknown>;
    };
  };

  const byDeliveryIdQuery = admin
    .from("driver_location_events")
    .select("delivery_id, is_mocked, recorded_at") as {
    in: (
      column: string,
      values: string[],
    ) => {
      order: (
        column: string,
        options: { ascending: boolean },
      ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };

  const { data: byDeliveryId, error: err1 } = await byDeliveryIdQuery
    .in("delivery_id", deliveryIds)
    .order("recorded_at", { ascending: false });

  if (err1) {
    console.error("[fetchDeliveriesForAdmin] gps mock by delivery_id failed", err1);
  } else {
    for (const row of (byDeliveryId ?? []) as unknown as Array<{
      delivery_id: string | null;
      is_mocked: boolean | null;
    }>) {
      if (!row.delivery_id || result.has(row.delivery_id)) continue;
      if (row.is_mocked === true) result.set(row.delivery_id, true);
      else if (!result.has(row.delivery_id)) result.set(row.delivery_id, false);
    }
  }

  const missing = deliveryIds.filter((id) => !result.has(id));
  if (missing.length > 0) {
    const byActiveIdQuery = admin
      .from("driver_location_events")
      .select("active_delivery_id, is_mocked, recorded_at") as {
      in: (
        column: string,
        values: string[],
      ) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };

    const { data: byActiveId, error: err2 } = await byActiveIdQuery
      .in("active_delivery_id", missing)
      .order("recorded_at", { ascending: false });

    if (err2) {
      console.error("[fetchDeliveriesForAdmin] gps mock by active_delivery_id failed", err2);
    } else {
      for (const row of (byActiveId ?? []) as unknown as Array<{
        active_delivery_id: string | null;
        is_mocked: boolean | null;
      }>) {
        const id = row.active_delivery_id;
        if (!id || result.has(id)) continue;
        if (row.is_mocked === true) result.set(id, true);
        else if (!result.has(id)) result.set(id, false);
      }
    }
  }

  for (const id of deliveryIds) {
    if (!result.has(id)) result.set(id, false);
  }
  return result;
}

type RecentDeliveryDbRow = {
  id: string;
  driver_id: string;
  status: DeliveryStatus;
  delivered_at: string;
  partners: { name: string } | { name: string }[] | null;
};

export type RecentDeliveryForDriver = {
  id: string;
  driver_id: string;
  short_id: string;
  status: DeliveryStatus;
  partner_name: string;
  delivered_at: string;
};

export async function fetchDeliveriesForAdmin(): Promise<DeliveryListRow[]> {
  await requireDeliveriesView();
  void logAdminRead("deliveries", "fetchDeliveriesForAdmin");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deliveries")
    .select(
      `
      id,
      driver_id,
      partner_id,
      restaurant_id,
      zone_id,
      external_order_id,
      order_proof_url,
      status,
      rejection_reason,
      delivered_at,
      delivered_lat,
      delivered_lng,
      pickup_at,
      pickup_lat,
      pickup_lng,
      pickup_proof_url,
      cancelled_at,
      cancel_lat,
      cancel_lng,
      cancel_reason,
      cancel_proof_url,
      created_at,
      drivers (driver_code, profiles (full_name, phone)),
      partners (name, logo_url),
      restaurants (id, name),
      zones (name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DeliveryDbRow[];
  const deliveryIds = rows.map((r) => r.id);
  const mockFlags = await fetchGpsMockFlagsByDeliveryIds(deliveryIds);
  const partnerLogoCache = new Map<string, string | null>();
  const proofCache = new Map<string, ProofResolved>();

  const mapped = await Promise.all(
    rows.map(async (row) => {
      const driverRel = Array.isArray(row.drivers) ? row.drivers[0] : row.drivers;
      const profileRel = driverRel?.profiles;
      const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;

      const partnerRel = Array.isArray(row.partners) ? row.partners[0] : row.partners;
      const partnerLogoKey = partnerRel?.logo_url ?? null;

      let partner_logo_url: string | null = null;
      if (partnerLogoKey) {
        if (partnerLogoCache.has(partnerLogoKey)) {
          partner_logo_url = partnerLogoCache.get(partnerLogoKey) ?? null;
        } else {
          partner_logo_url = await resolvePartnerLogoUrl(partnerLogoKey);
          partnerLogoCache.set(partnerLogoKey, partner_logo_url);
        }
      }

      const proofKey = row.order_proof_url?.trim() ?? "";
      const pickupProofKey = row.pickup_proof_url?.trim() ?? "";
      const cancelProofKey = row.cancel_proof_url?.trim() ?? "";

      const deliveryProof = proofKey ? await resolveProofCached(proofKey, proofCache) : null;
      const pickupProof = pickupProofKey
        ? await resolveProofCached(pickupProofKey, proofCache)
        : null;
      const cancelProof = cancelProofKey
        ? await resolveProofCached(cancelProofKey, proofCache)
        : null;

      return {
        id: row.id,
        short_id: shortId(row.id),
        driver_id: row.driver_id,
        driver_name: profile?.full_name ?? "—",
        driver_code: driverRel?.driver_code ?? "—",
        driver_phone: profile?.phone ?? "—",
        partner_id: row.partner_id,
        partner_name: relName(row.partners),
        partner_logo_url,
        restaurant_id: row.restaurant_id,
        restaurant_name: (() => {
          const rel = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
          return rel?.name ?? null;
        })(),
        zone_id: row.zone_id,
        zone_name: relName(row.zones),
        status: row.status,
        external_order_id: row.external_order_id,
        order_proof_url: row.order_proof_url,
        proof_display_url: deliveryProof?.url ?? null,
        proof_content_type: deliveryProof?.contentType ?? null,
        pickup_at: row.pickup_at,
        pickup_lat: parseCoord(row.pickup_lat),
        pickup_lng: parseCoord(row.pickup_lng),
        pickup_proof_url: row.pickup_proof_url,
        pickup_proof_display_url: pickupProof?.url ?? null,
        pickup_proof_content_type: pickupProof?.contentType ?? null,
        cancelled_at: row.cancelled_at,
        cancel_lat: parseCoord(row.cancel_lat),
        cancel_lng: parseCoord(row.cancel_lng),
        cancel_reason: row.cancel_reason,
        cancel_proof_url: row.cancel_proof_url,
        cancel_proof_display_url: cancelProof?.url ?? null,
        cancel_proof_content_type: cancelProof?.contentType ?? null,
        rejection_reason: row.rejection_reason,
        delivered_at: row.delivered_at,
        delivered_lat: parseCoord(row.delivered_lat),
        delivered_lng: parseCoord(row.delivered_lng),
        created_at: row.created_at,
        gps_is_mocked: mockFlags.get(row.id) ?? false,
      };
    }),
  );

  return sortDeliveriesByActivity(mapped);
}

export async function fetchRecentDeliveriesForDriver(
  driverId: string,
  limit = 2,
): Promise<RecentDeliveryForDriver[]> {
  await requireDeliveriesView();
  void logAdminRead("deliveries", "fetchRecentDeliveriesForDriver");

  if (!driverId) return [];

  const supabase = await createClient();
  const safeLimit = Math.max(1, Math.min(limit, 10));
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      `
      id,
      driver_id,
      status,
      delivered_at,
      partners (name)
    `,
    )
    .eq("driver_id", driverId)
    .order("delivered_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as RecentDeliveryDbRow[];
  return rows.map((row) => ({
    id: row.id,
    driver_id: row.driver_id,
    short_id: shortId(row.id),
    status: row.status,
    partner_name: relName(row.partners),
    delivered_at: row.delivered_at,
  }));
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: ReviewableDeliveryStatus,
  rejectionReason?: string,
): Promise<DeliveryMutationResult> {
  const session = await requireDeliveriesManage();
  if (!session) return { error: "not_authorized" };

  if (status === "rejected") {
    const trimmed = rejectionReason?.trim() ?? "";
    if (!trimmed) return { error: "reason_required" };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, driver_id, delivered_at, status, partner_id, restaurant_id")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !existing) {
    return {
      error: "update_failed",
      errorDetail: formatPgErrorDetail(fetchError),
    };
  }

  if (
    (existing.status as DeliveryStatus) === "in_transit" ||
    (existing.status as DeliveryStatus) === "cancelled"
  ) {
    return { error: "invalid_status" };
  }

  const updatePayload =
    status === "rejected"
      ? {
          status: "rejected" as const,
          rejection_reason: rejectionReason!.trim(),
        }
      : {
          status,
          rejection_reason: null,
        };

  const resolvedRestaurantId =
    status === "verified"
      ? await resolveDeliveryRestaurantId(supabase, {
          driver_id: existing.driver_id,
          partner_id: (existing as { partner_id: string | null }).partner_id ?? null,
          restaurant_id: (existing as { restaurant_id: string | null }).restaurant_id ?? null,
        })
      : null;
  if (resolvedRestaurantId && status !== "rejected") {
    (updatePayload as Record<string, unknown>).restaurant_id = resolvedRestaurantId;
  }

  const { error } = await supabase
    .from("deliveries")
    .update(updatePayload)
    .eq("id", deliveryId);

  if (error) {
    return {
      error: "update_failed",
      errorDetail: formatPgErrorDetail(error),
    };
  }

  void logAdminMutation({
    action: "update",
    entityType: "delivery",
    entityId: deliveryId,
    routeName: "updateDeliveryStatus",
    before: { status: existing.status },
    after: {
      status,
      rejection_reason: status === "rejected" ? rejectionReason?.trim() ?? null : null,
    },
    context: { driver_id: existing.driver_id, delivered_at: existing.delivered_at },
  });

  const affectsEarnings =
    existing.status === "verified" ||
    status === "verified";
  if (affectsEarnings && existing.delivered_at) {
    await recalcEarningsForDelivery(
      supabase,
      existing.driver_id,
      existing.delivered_at,
    );
  }

  // Mirror the admin's decision into DPD verifications so the verification
  // page stays in sync without a manual entry.
  await syncVerificationForDelivery(
    supabase,
    {
      id: existing.id,
      driver_id: existing.driver_id,
      delivered_at: existing.delivered_at ?? new Date().toISOString(),
      partner_id: (existing as { partner_id: string | null }).partner_id ?? null,
      restaurant_id:
        resolvedRestaurantId ??
        ((existing as { restaurant_id: string | null }).restaurant_id ?? null),
    },
    session.id,
  );

  return { ok: true };
}

export async function verifyDelivery(
  deliveryId: string,
): Promise<DeliveryMutationResult> {
  return updateDeliveryStatus(deliveryId, "verified");
}

export async function rejectDelivery(
  deliveryId: string,
  reason: string,
): Promise<DeliveryMutationResult> {
  return updateDeliveryStatus(deliveryId, "rejected", reason);
}

export async function deleteDelivery(
  deliveryId: string,
): Promise<DeliveryMutationResult> {
  const session = await requireSuperAdmin();
  if (!session) return { error: "not_authorized" };

  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, driver_id, delivered_at, order_proof_url, status")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !row) {
    return {
      error: "delete_failed",
      errorDetail: formatPgErrorDetail(fetchError),
    };
  }

  const proofKey = row.order_proof_url?.trim() ?? "";

  if (proofKey && isR2ObjectKey(proofKey)) {
    try {
      await deleteObject(proofKey);
    } catch {
      /* best-effort R2 cleanup */
    }
    try {
      const admin = createAdminClient();
      await admin.from("storage_uploads").delete().eq("object_key", proofKey);
    } catch {
      /* best-effort audit cleanup */
    }
  }

  const { error: deleteError } = await supabase
    .from("deliveries")
    .delete()
    .eq("id", deliveryId);

  if (deleteError) {
    return {
      error: "delete_failed",
      errorDetail: formatPgErrorDetail(deleteError),
    };
  }

  void logAdminMutation({
    action: "delete",
    entityType: "delivery",
    entityId: deliveryId,
    routeName: "deleteDelivery",
    before: {
      status: row.status,
      driver_id: row.driver_id,
      delivered_at: row.delivered_at,
    },
  });

  if (row.status === "verified" && row.delivered_at) {
    await recalcEarningsForDelivery(supabase, row.driver_id, row.delivered_at);
  }

  return { ok: true };
}

export type LiveDriverLocationForDelivery = {
  latitude: number;
  longitude: number;
  lastSeenAt: string;
  isMocked: boolean | null;
  headingDeg: number | null;
};

export async function fetchLiveDriverLocationForDelivery(
  deliveryId: string,
  driverId: string,
): Promise<LiveDriverLocationForDelivery | null> {
  await requireDeliveriesView();
  if (!deliveryId || !driverId) return null;

  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => Record<string, unknown>;
    };
  };

  const liveQuery = supabase
    .from("driver_locations")
    .select(
      "latitude, longitude, last_seen_at, is_mocked, heading_deg, active_delivery_id",
    ) as {
    eq: (
      column: string,
      value: string,
    ) => {
      maybeSingle: () => Promise<{
        data: Record<string, unknown> | null;
        error: { message: string } | null;
      }>;
    };
  };

  const { data, error } = await liveQuery.eq("driver_id", driverId).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as {
    latitude: number | string;
    longitude: number | string;
    last_seen_at: string;
    is_mocked: boolean | null;
    heading_deg: number | string | null;
    active_delivery_id: string | null;
  };

  if (row.active_delivery_id && row.active_delivery_id !== deliveryId) {
    return null;
  }

  return {
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    lastSeenAt: row.last_seen_at,
    isMocked: row.is_mocked,
    headingDeg: row.heading_deg != null ? Number(row.heading_deg) : null,
  };
}
