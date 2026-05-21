"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { resolvePartnerLogoUrl } from "@/lib/storage/partner-logo-url";
import type { DeliveryListRow, DeliveryStatus } from "./types";

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

export async function fetchDeliveriesForAdmin(): Promise<DeliveryListRow[]> {
  await requireDeliveriesView();
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
        rejection_reason: row.rejection_reason,
        delivered_at: row.delivered_at,
        created_at: row.created_at,
      };
    }),
  );
}
