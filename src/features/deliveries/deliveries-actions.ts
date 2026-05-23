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
} from "./types";

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

function earnDateFromDeliveredAt(deliveredAt: string): string {
  const d = new Date(deliveredAt);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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
  zone_id: string | null;
  external_order_id: string | null;
  order_proof_url: string | null;
  status: DeliveryStatus;
  rejection_reason: string | null;
  delivered_at: string;
  delivered_lat: number | null;
  delivered_lng: number | null;
  created_at: string;
  drivers: {
    driver_code: string;
    profiles: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] | null;
  } | {
    driver_code: string;
    profiles: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] | null;
  }[] | null;
  partners: { name: string; logo_url: string | null } | { name: string; logo_url: string | null }[] | null;
  zones: { name: string } | { name: string }[] | null;
};

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
      zone_id,
      external_order_id,
      order_proof_url,
      status,
      rejection_reason,
      delivered_at,
      delivered_lat,
      delivered_lng,
      created_at,
      drivers (driver_code, profiles (full_name, phone)),
      partners (name, logo_url),
      zones (name)
    `,
    )
    .order("delivered_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DeliveryDbRow[];
  const partnerLogoCache = new Map<string, string | null>();
  const proofCache = new Map<
    string,
    { url: string; contentType: string | null } | null
  >();

  return Promise.all(
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
      let proof_display_url: string | null = null;
      let proof_content_type: string | null = null;

      if (proofKey) {
        if (!proofCache.has(proofKey)) {
          const resolved = await resolveOrderProofUrl(proofKey);
          proofCache.set(
            proofKey,
            resolved
              ? { url: resolved.url, contentType: resolved.contentType }
              : null,
          );
        }
        const cached = proofCache.get(proofKey);
        if (cached) {
          proof_display_url = cached.url;
          proof_content_type = cached.contentType;
        }
      }

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
        zone_id: row.zone_id,
        zone_name: relName(row.zones),
        status: row.status,
        external_order_id: row.external_order_id,
        order_proof_url: row.order_proof_url,
        proof_display_url,
        proof_content_type,
        rejection_reason: row.rejection_reason,
        delivered_at: row.delivered_at,
        delivered_lat: parseCoord(row.delivered_lat),
        delivered_lng: parseCoord(row.delivered_lng),
        created_at: row.created_at,
      };
    }),
  );
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
  status: DeliveryStatus,
  rejectionReason?: string,
): Promise<{ ok: true } | { error: DeliveryActionError }> {
  const session = await requireDeliveriesManage();
  if (!session) return { error: "not_authorized" };

  if (status === "rejected") {
    const trimmed = rejectionReason?.trim() ?? "";
    if (!trimmed) return { error: "reason_required" };
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, driver_id, delivered_at, status")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !existing) return { error: "update_failed" };

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

  const { error } = await supabase
    .from("deliveries")
    .update(updatePayload)
    .eq("id", deliveryId);

  if (error) return { error: "update_failed" };

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
  if (affectsEarnings) {
    await recalcEarningsForDelivery(
      supabase,
      existing.driver_id,
      existing.delivered_at,
    );
  }

  return { ok: true };
}

export async function verifyDelivery(
  deliveryId: string,
): Promise<{ ok: true } | { error: DeliveryActionError }> {
  return updateDeliveryStatus(deliveryId, "verified");
}

export async function rejectDelivery(
  deliveryId: string,
  reason: string,
): Promise<{ ok: true } | { error: DeliveryActionError }> {
  return updateDeliveryStatus(deliveryId, "rejected", reason);
}

export async function deleteDelivery(
  deliveryId: string,
): Promise<{ ok: true } | { error: DeliveryActionError }> {
  const session = await requireSuperAdmin();
  if (!session) return { error: "not_authorized" };

  const supabase = await createClient();
  const { data: row, error: fetchError } = await supabase
    .from("deliveries")
    .select("id, driver_id, delivered_at, order_proof_url, status")
    .eq("id", deliveryId)
    .maybeSingle();

  if (fetchError || !row) return { error: "delete_failed" };

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

  if (deleteError) return { error: "delete_failed" };

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

  if (row.status === "verified") {
    await recalcEarningsForDelivery(supabase, row.driver_id, row.delivered_at);
  }

  return { ok: true };
}
