import { resolveOrderProofUrl } from "@/lib/storage/order-proof-url";
import { resolvePartnerLogoUrl } from "@/lib/storage/partner-logo-url";
import type { DeliveryListRow, DeliveryStatus } from "./types";

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

export type DeliveryDbRowForList = {
  id: string;
  driver_id: string;
  partner_id: string | null;
  restaurant_id?: string | null;
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
    profiles:
      | { full_name: string | null; phone: string | null }
      | { full_name: string | null; phone: string | null }[]
      | null;
  } | {
    driver_code: string;
    profiles:
      | { full_name: string | null; phone: string | null }
      | { full_name: string | null; phone: string | null }[]
      | null;
  }[] | null;
  partners:
    | { name: string; logo_url: string | null }
    | { name: string; logo_url: string | null }[]
    | null;
  restaurants?:
    | { id: string; name: string }
    | { id: string; name: string }[]
    | null;
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

export async function mapDeliveryDbRowsToListRows(
  rows: DeliveryDbRowForList[],
  gpsMockFlags: Map<string, boolean> = new Map(),
): Promise<DeliveryListRow[]> {
  const partnerLogoCache = new Map<string, string | null>();
  const proofCache = new Map<string, ProofResolved>();

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
      const pickupProofKey = row.pickup_proof_url?.trim() ?? "";
      const cancelProofKey = row.cancel_proof_url?.trim() ?? "";

      const deliveryProof = proofKey
        ? await resolveProofCached(proofKey, proofCache)
        : null;
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
        restaurant_id: row.restaurant_id ?? null,
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
        gps_is_mocked: gpsMockFlags.get(row.id) ?? false,
      };
    }),
  );
}
