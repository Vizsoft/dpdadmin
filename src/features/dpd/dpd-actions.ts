"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { isDpdErrorKey, type DpdErrorKey } from "./dpd-errors";
import {
  previewDriverEarnings,
  recalculateEarningsForDate,
  validateDeliveryForRules,
} from "./incentive-calculator";
import type {
  DeliveryRuleRow,
  DpdScopeOptions,
  IncentiveRuleRow,
  IncentivePeriod,
  RestaurantRow,
  RuleScopeType,
  RuleStatus,
} from "./types";

export type DpdMutationResult = {
  error?: DpdErrorKey | string;
  success?: boolean;
  id?: string;
};

async function requireEarningsView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "earnings.view", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

async function requireEarningsManage() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "earnings.manage", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

function scopeLabel(
  scopeType: RuleScopeType,
  zone?: { name: string; code: string } | null,
  partner?: { name: string } | null,
  restaurant?: { name: string } | null,
): string {
  switch (scopeType) {
    case "zone":
      return zone ? `${zone.name} (${zone.code})` : "—";
    case "partner":
      return partner?.name ?? "—";
    case "restaurant":
      return restaurant?.name ?? "—";
    default:
      return "—";
  }
}

function parseScopeFromForm(formData: FormData): {
  scopeType: RuleScopeType;
  zoneId: string | null;
  partnerId: string | null;
  restaurantId: string | null;
} | { error: DpdErrorKey } {
  const scopeType = String(formData.get("scopeType") ?? "").trim() as RuleScopeType;
  const zoneId = String(formData.get("zoneId") ?? "").trim() || null;
  const partnerId = String(formData.get("partnerId") ?? "").trim() || null;
  const restaurantId = String(formData.get("restaurantId") ?? "").trim() || null;

  if (!["zone", "partner", "restaurant"].includes(scopeType)) {
    return { error: "invalid_scope" };
  }
  if (scopeType === "zone" && !zoneId) return { error: "invalid_scope" };
  if (scopeType === "partner" && !partnerId) return { error: "invalid_scope" };
  if (scopeType === "restaurant" && !restaurantId) return { error: "invalid_scope" };

  return {
    scopeType,
    zoneId: scopeType === "zone" ? zoneId : null,
    partnerId: scopeType === "partner" ? partnerId : null,
    restaurantId: scopeType === "restaurant" ? restaurantId : null,
  };
}

function parseDates(formData: FormData): { startDate: string; endDate: string } | { error: DpdErrorKey } {
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  if (!startDate || !endDate || endDate < startDate) {
    return { error: "invalid_dates" };
  }
  return { startDate, endDate };
}

function defaultPriority(scopeType: RuleScopeType): number {
  switch (scopeType) {
    case "restaurant":
      return 30;
    case "partner":
      return 20;
    case "zone":
      return 10;
    default:
      return 10;
  }
}

export async function fetchDpdScopeOptions(): Promise<DpdScopeOptions> {
  await requireEarningsView();
  const supabase = await createClient();

  const [{ data: zones }, { data: partners }, { data: restaurants }] =
    await Promise.all([
      supabase.from("zones").select("id, name, code").order("name"),
      supabase.from("partners").select("id, name").order("name"),
      supabase
        .from("restaurants")
        .select("id, name, partner_id")
        .eq("is_active", true)
        .order("name"),
    ]);

  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]));

  return {
    zones: zones ?? [],
    partners: partners ?? [],
    restaurants: (restaurants ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      partner_id: r.partner_id,
      partner_name: partnerMap.get(r.partner_id) ?? "—",
    })),
  };
}

export async function fetchRestaurantsForAdmin(): Promise<RestaurantRow[]> {
  await requireEarningsView();
  const supabase = await createClient();
  const [{ data, error }, { data: partners }] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, partner_id, name, external_merchant_id, is_active, created_at")
      .order("name"),
    supabase.from("partners").select("id, name"),
  ]);

  if (error) throw error;

  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p.name]));

  return (data ?? []).map((row) => {
    return {
      id: row.id,
      partner_id: row.partner_id,
      partner_name: partnerMap.get(row.partner_id) ?? "—",
      name: row.name,
      external_merchant_id: row.external_merchant_id,
      is_active: row.is_active,
      created_at: row.created_at,
    };
  });
}

async function loadScopeLabelMaps(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: zones }, { data: partners }, { data: restaurants }] =
    await Promise.all([
      supabase.from("zones").select("id, name, code"),
      supabase.from("partners").select("id, name"),
      supabase.from("restaurants").select("id, name"),
    ]);
  return {
    zones: new Map((zones ?? []).map((z) => [z.id, z])),
    partners: new Map((partners ?? []).map((p) => [p.id, p])),
    restaurants: new Map((restaurants ?? []).map((r) => [r.id, r])),
  };
}

export async function fetchDeliveryRulesForAdmin(): Promise<DeliveryRuleRow[]> {
  await requireEarningsView();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_rules")
    .select(
      "id, name, status, scope_type, zone_id, partner_id, restaurant_id, start_date, end_date, priority",
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const maps = await loadScopeLabelMaps(supabase);

  return (data ?? []).map((row) => {
    const zone = row.zone_id ? maps.zones.get(row.zone_id) : null;
    const partner = row.partner_id ? maps.partners.get(row.partner_id) : null;
    const restaurant = row.restaurant_id
      ? maps.restaurants.get(row.restaurant_id)
      : null;
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      scope_type: row.scope_type,
      zone_id: row.zone_id,
      partner_id: row.partner_id,
      restaurant_id: row.restaurant_id,
      scope_label: scopeLabel(row.scope_type, zone, partner, restaurant),
      start_date: row.start_date,
      end_date: row.end_date,
      priority: row.priority,
    };
  });
}

export async function fetchIncentiveRulesForAdmin(): Promise<IncentiveRuleRow[]> {
  await requireEarningsView();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incentive_rules")
    .select(
      "id, name, status, scope_type, zone_id, partner_id, restaurant_id, period, target_deliveries, reward_kwd, start_date, end_date, priority",
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const maps = await loadScopeLabelMaps(supabase);

  return (data ?? []).map((row) => {
    const zone = row.zone_id ? maps.zones.get(row.zone_id) : null;
    const partner = row.partner_id ? maps.partners.get(row.partner_id) : null;
    const restaurant = row.restaurant_id
      ? maps.restaurants.get(row.restaurant_id)
      : null;
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      scope_type: row.scope_type,
      zone_id: row.zone_id,
      partner_id: row.partner_id,
      restaurant_id: row.restaurant_id,
      scope_label: scopeLabel(row.scope_type, zone, partner, restaurant),
      period: row.period,
      target_deliveries: row.target_deliveries,
      reward_kwd: Number(row.reward_kwd),
      start_date: row.start_date,
      end_date: row.end_date,
      priority: row.priority,
    };
  });
}

export async function saveRestaurant(formData: FormData): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const externalMerchantId = String(formData.get("externalMerchantId") ?? "").trim();
  const isActive = formData.get("isActive") === "true";

  if (!partnerId || !name) return { error: "missing_fields" };

  const supabase = await createClient();
  const payload = {
    partner_id: partnerId,
    name,
    external_merchant_id: externalMerchantId || null,
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

  const { data, error } = await supabase
    .from("restaurants")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "restaurant_exists" };
    return { error: "save_failed" };
  }
  return { success: true, id: data.id };
}

export async function deleteRestaurant(id: string): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };
  if (!id) return { error: "missing_fields" };

  const supabase = await createClient();
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) return { error: "delete_failed" };
  return { success: true };
}

export async function saveDeliveryRule(formData: FormData): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() as RuleStatus;
  const priorityRaw = String(formData.get("priority") ?? "").trim();

  if (!name) return { error: "missing_fields" };

  const scope = parseScopeFromForm(formData);
  if ("error" in scope) return { error: scope.error };

  const dates = parseDates(formData);
  if ("error" in dates) return { error: dates.error };

  const priority = priorityRaw ? Number(priorityRaw) : defaultPriority(scope.scopeType);

  const supabase = await createClient();
  const payload = {
    name,
    status,
    scope_type: scope.scopeType,
    zone_id: scope.zoneId,
    partner_id: scope.partnerId,
    restaurant_id: scope.restaurantId,
    start_date: dates.startDate,
    end_date: dates.endDate,
    priority,
    require_verified: true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("delivery_rules").update(payload).eq("id", id);
    if (error) return { error: "save_failed" };
    return { success: true, id };
  }

  const { data, error } = await supabase
    .from("delivery_rules")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: "save_failed" };
  return { success: true, id: data.id };
}

export async function deleteDeliveryRule(id: string): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };
  if (!id) return { error: "missing_fields" };

  const supabase = await createClient();
  const { error } = await supabase.from("delivery_rules").delete().eq("id", id);
  if (error) return { error: "delete_failed" };
  return { success: true };
}

export async function saveIncentiveRule(formData: FormData): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() as RuleStatus;
  const period = String(formData.get("period") ?? "").trim() as IncentivePeriod;
  const targetRaw = String(formData.get("targetDeliveries") ?? "").trim();
  const rewardRaw = String(formData.get("rewardKwd") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();

  if (!name || !period) return { error: "missing_fields" };

  const target = Number(targetRaw);
  const reward = Number(rewardRaw);
  if (!Number.isFinite(target) || target < 1) return { error: "invalid_target" };
  if (!Number.isFinite(reward) || reward < 0) return { error: "invalid_reward" };

  const scope = parseScopeFromForm(formData);
  if ("error" in scope) return { error: scope.error };

  const dates = parseDates(formData);
  if ("error" in dates) return { error: dates.error };

  const priority = priorityRaw ? Number(priorityRaw) : defaultPriority(scope.scopeType);

  const supabase = await createClient();
  const payload = {
    name,
    status,
    scope_type: scope.scopeType,
    zone_id: scope.zoneId,
    partner_id: scope.partnerId,
    restaurant_id: scope.restaurantId,
    period,
    target_deliveries: target,
    reward_kwd: reward,
    start_date: dates.startDate,
    end_date: dates.endDate,
    priority,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("incentive_rules").update(payload).eq("id", id);
    if (error) return { error: "save_failed" };
    return { success: true, id };
  }

  const { data, error } = await supabase
    .from("incentive_rules")
    .insert(payload)
    .select("id")
    .single();

  if (error) return { error: "save_failed" };
  return { success: true, id: data.id };
}

export async function deleteIncentiveRule(id: string): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };
  if (!id) return { error: "missing_fields" };

  const supabase = await createClient();
  const { error } = await supabase.from("incentive_rules").delete().eq("id", id);
  if (error) return { error: "delete_failed" };
  return { success: true };
}

export async function runPreviewEarnings(earnDate: string) {
  const auth = await requireEarningsView();
  if (auth.error) return { error: auth.error };
  if (!earnDate) return { error: "missing_fields" as const };
  return previewDriverEarnings(earnDate);
}

export async function runRecalculateEarnings(earnDate: string) {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };
  if (!earnDate) return { error: "missing_fields" as const };
  return recalculateEarningsForDate(earnDate);
}

export async function runValidateDelivery(deliveryId: string) {
  const auth = await requireEarningsView();
  if (auth.error) return { error: auth.error };
  if (!deliveryId) return { error: "missing_fields" as const };
  return validateDeliveryForRules(deliveryId);
}

export { isDpdErrorKey };
