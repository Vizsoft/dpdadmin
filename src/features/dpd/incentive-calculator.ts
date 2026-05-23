import { createClient } from "@/lib/supabase/server";
import type {
  DeliveryValidationResult,
  EarningsDailyListResult,
  EarningsDetailResult,
  EarningsPreviewResult,
} from "./types";

export async function validateDeliveryForRules(
  deliveryId: string,
): Promise<DeliveryValidationResult> {
  const supabase = await createClient();

  const { data: delivery, error } = await supabase
    .from("deliveries")
    .select("id, status, zone_id, partner_id, restaurant_id, delivered_at")
    .eq("id", deliveryId)
    .maybeSingle();

  if (error || !delivery) {
    return {
      eligible: false,
      matchedRuleIds: [],
      reasons: ["delivery_not_found"],
    };
  }

  if (delivery.status !== "verified") {
    return {
      eligible: false,
      matchedRuleIds: [],
      reasons: ["not_verified"],
    };
  }

  const { data: matches, error: matchError } = await supabase.rpc(
    "delivery_matches_rules",
    { p_delivery_id: deliveryId },
  );

  if (matchError) {
    return {
      eligible: false,
      matchedRuleIds: [],
      reasons: ["validation_failed"],
    };
  }

  const { data: rules } = await supabase
    .from("delivery_rules")
    .select("id, name, scope_type, zone_id, partner_id, restaurant_id")
    .eq("status", "active");

  const matchedRuleIds: string[] = [];
  const reasons: string[] = [];

  if (matches) {
    for (const rule of rules ?? []) {
      const hit =
        (rule.scope_type === "zone" && rule.zone_id === delivery.zone_id) ||
        (rule.scope_type === "partner" &&
          rule.partner_id === delivery.partner_id) ||
        (rule.scope_type === "restaurant" &&
          rule.restaurant_id === delivery.restaurant_id);
      if (hit) matchedRuleIds.push(rule.id);
    }
    if (matchedRuleIds.length === 0 && (rules?.length ?? 0) > 0) {
      reasons.push("no_matching_scope");
    }
  } else if ((rules?.length ?? 0) > 0) {
    reasons.push("no_matching_scope");
  }

  return {
    eligible: Boolean(matches),
    matchedRuleIds,
    reasons,
  };
}

export async function previewDriverEarnings(
  earnDate: string,
): Promise<EarningsPreviewResult | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_driver_earnings", {
    p_earn_date: earnDate,
  });

  if (error) return { error: "preview_failed" };
  return data as EarningsPreviewResult;
}

export async function recalculateEarningsForDate(
  earnDate: string,
): Promise<{ count: number } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recalculate_earnings_for_date", {
    p_earn_date: earnDate,
  });

  if (error) return { error: "recalc_failed" };
  return { count: data ?? 0 };
}

export async function recalculateDriverEarnings(
  driverId: string,
  earnDate: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("recalculate_driver_earnings", {
    p_driver_id: driverId,
    p_earn_date: earnDate,
  });

  if (error) return { error: "recalc_failed" };
  return { success: true };
}

export async function recalculateEarningsForRange(
  startDate: string,
  endDate: string,
  driverId?: string | null,
): Promise<{ count: number } | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("recalculate_earnings_for_range", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_driver_id: driverId ?? undefined,
  });

  if (error) return { error: "recalc_failed" };
  return { count: data ?? 0 };
}

export async function getDriverEarningsDetail(
  driverId: string,
  earnDate: string,
): Promise<EarningsDetailResult | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_driver_earnings_detail", {
    p_driver_id: driverId,
    p_earn_date: earnDate,
  });

  if (error) return { error: "detail_failed" };
  return data as EarningsDetailResult;
}

export async function listDriverEarningsDaily(
  startDate: string,
  endDate: string,
  driverId?: string | null,
): Promise<EarningsDailyListResult | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_driver_earnings_daily", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_driver_id: driverId ?? undefined,
  });

  if (error) return { error: "list_failed" };
  return data as EarningsDailyListResult;
}
