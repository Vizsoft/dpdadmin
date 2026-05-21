"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import {
  parseRestaurantFormData,
  validateRestaurantCoordinates,
} from "@/features/restaurants/parse-restaurant-form";
import { isDpdErrorKey, type DpdErrorKey } from "./dpd-errors";
import {
  previewDriverEarnings,
  recalculateEarningsForDate,
  validateDeliveryForRules,
} from "./incentive-calculator";
import type {
  DeliveryRuleRow,
  DpdScopeOptions,
  IncentivePayoutMode,
  IncentiveRewardMode,
  IncentiveRuleRow,
  IncentiveRuleTierRow,
  IncentiveTargetMode,
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
        .eq("status", "published")
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
  const [{ data, error }, { data: partners }, { data: zones }] = await Promise.all([
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

  return (data ?? []).map((row) => {
    return {
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

type IncentiveRuleDbRow = {
  id: string;
  name: string;
  status: RuleStatus;
  scope_type: RuleScopeType;
  zone_id: string | null;
  partner_id: string | null;
  restaurant_id: string | null;
  period: IncentivePeriod;
  target_mode: IncentiveTargetMode;
  base_minimum_deliveries: number;
  target_deliveries: number | null;
  reward_mode: IncentiveRewardMode;
  reward_kwd: number | string;
  reward_per_delivery_kwd: number | string | null;
  payout_mode: IncentivePayoutMode;
  overrides_others: boolean;
  start_date: string;
  end_date: string;
  priority: number;
  incentive_rule_tiers?: {
    id: string;
    threshold_deliveries: number;
    reward_mode: IncentiveRewardMode;
    reward_kwd: number | string | null;
    reward_per_delivery_kwd: number | string | null;
    sort_order: number;
  }[];
};

function mapIncentiveTierRow(
  tier: NonNullable<IncentiveRuleDbRow["incentive_rule_tiers"]>[number],
): IncentiveRuleTierRow {
  return {
    id: tier.id,
    threshold_deliveries: tier.threshold_deliveries,
    reward_mode: tier.reward_mode,
    reward_kwd: tier.reward_kwd != null ? Number(tier.reward_kwd) : null,
    reward_per_delivery_kwd:
      tier.reward_per_delivery_kwd != null
        ? Number(tier.reward_per_delivery_kwd)
        : null,
    sort_order: tier.sort_order,
  };
}

export async function fetchIncentiveRulesForAdmin(): Promise<IncentiveRuleRow[]> {
  await requireEarningsView();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incentive_rules")
    .select(
      `id, name, status, scope_type, zone_id, partner_id, restaurant_id, period,
       target_mode, base_minimum_deliveries, target_deliveries, reward_mode,
       reward_kwd, reward_per_delivery_kwd, payout_mode, overrides_others,
       start_date, end_date, priority,
       incentive_rule_tiers (id, threshold_deliveries, reward_mode, reward_kwd, reward_per_delivery_kwd, sort_order)`,
    )
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const maps = await loadScopeLabelMaps(supabase);

  return ((data ?? []) as IncentiveRuleDbRow[]).map((row) => {
    const zone = row.zone_id ? maps.zones.get(row.zone_id) : null;
    const partner = row.partner_id ? maps.partners.get(row.partner_id) : null;
    const restaurant = row.restaurant_id
      ? maps.restaurants.get(row.restaurant_id)
      : null;
    const tiers = (row.incentive_rule_tiers ?? [])
      .map(mapIncentiveTierRow)
      .sort((a, b) => a.sort_order - b.sort_order || a.threshold_deliveries - b.threshold_deliveries);
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
      target_mode: row.target_mode ?? "single",
      base_minimum_deliveries: row.base_minimum_deliveries ?? 0,
      target_deliveries: row.target_deliveries,
      reward_mode: row.reward_mode ?? "fixed",
      reward_kwd: Number(row.reward_kwd),
      reward_per_delivery_kwd:
        row.reward_per_delivery_kwd != null
          ? Number(row.reward_per_delivery_kwd)
          : null,
      payout_mode: row.payout_mode ?? "milestone",
      overrides_others: row.overrides_others ?? false,
      tiers,
      start_date: row.start_date,
      end_date: row.end_date,
      priority: row.priority,
    };
  });
}

export async function saveRestaurant(formData: FormData): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };
  const { session } = auth;

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

  const { data, error } = await supabase
    .from("restaurants")
    .insert({ ...payload, created_by: session.id })
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

type TierInput = {
  threshold_deliveries: number;
  reward_mode: IncentiveRewardMode;
  reward_kwd: number | null;
  reward_per_delivery_kwd: number | null;
};

function parseTiersJson(raw: string): TierInput[] | { error: DpdErrorKey } {
  if (!raw.trim()) return { error: "invalid_tiers" };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return { error: "invalid_tiers" };
    const tiers: TierInput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") return { error: "invalid_tiers" };
      const row = item as Record<string, unknown>;
      const threshold = Number(row.threshold_deliveries);
      const rewardMode = String(row.reward_mode ?? "") as IncentiveRewardMode;
      if (!Number.isFinite(threshold) || threshold < 1) return { error: "invalid_tiers" };
      if (rewardMode !== "fixed" && rewardMode !== "per_delivery") {
        return { error: "invalid_reward_mode" };
      }
      const rewardKwd =
        row.reward_kwd != null && row.reward_kwd !== ""
          ? Number(row.reward_kwd)
          : null;
      const perDelivery =
        row.reward_per_delivery_kwd != null && row.reward_per_delivery_kwd !== ""
          ? Number(row.reward_per_delivery_kwd)
          : null;
      if (rewardMode === "fixed") {
        if (!Number.isFinite(rewardKwd!) || rewardKwd! < 0) return { error: "invalid_reward" };
      } else if (!Number.isFinite(perDelivery!) || perDelivery! < 0) {
        return { error: "invalid_reward" };
      }
      tiers.push({
        threshold_deliveries: threshold,
        reward_mode: rewardMode,
        reward_kwd: rewardMode === "fixed" ? rewardKwd : null,
        reward_per_delivery_kwd:
          rewardMode === "per_delivery" ? perDelivery : null,
      });
    }
    tiers.sort((a, b) => a.threshold_deliveries - b.threshold_deliveries);
    for (let i = 1; i < tiers.length; i++) {
      if (tiers[i].threshold_deliveries <= tiers[i - 1].threshold_deliveries) {
        return { error: "invalid_tiers" };
      }
    }
    return tiers;
  } catch {
    return { error: "invalid_tiers" };
  }
}

export async function saveIncentiveRule(formData: FormData): Promise<DpdMutationResult> {
  const auth = await requireEarningsManage();
  if (auth.error) return { error: auth.error };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim() as RuleStatus;
  const period = String(formData.get("period") ?? "").trim() as IncentivePeriod;
  const targetMode = String(formData.get("targetMode") ?? "single").trim() as IncentiveTargetMode;
  const baseRaw = String(formData.get("baseMinimumDeliveries") ?? "0").trim();
  const rewardMode = String(formData.get("rewardMode") ?? "fixed").trim() as IncentiveRewardMode;
  const payoutMode = (String(formData.get("payoutMode") ?? "milestone").trim() === "cumulative"
    ? "cumulative"
    : "milestone") as IncentivePayoutMode;
  const overridesOthers = String(formData.get("overridesOthers") ?? "false") === "true";
  const targetRaw = String(formData.get("targetDeliveries") ?? "").trim();
  const rewardRaw = String(formData.get("rewardKwd") ?? "").trim();
  const perDeliveryRaw = String(formData.get("rewardPerDeliveryKwd") ?? "").trim();
  const tiersRaw = String(formData.get("tiersJson") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "").trim();

  if (!name || !period) return { error: "missing_fields" };
  if (targetMode !== "single" && targetMode !== "tiered") return { error: "invalid_target" };

  const baseMinimum = Number(baseRaw);
  if (!Number.isFinite(baseMinimum) || baseMinimum < 0) return { error: "invalid_base" };

  const scope = parseScopeFromForm(formData);
  if ("error" in scope) return { error: scope.error };

  const dates = parseDates(formData);
  if ("error" in dates) return { error: dates.error };

  const priority = priorityRaw ? Number(priorityRaw) : defaultPriority(scope.scopeType);

  let targetDeliveries: number | null = null;
  let rewardKwd = 0;
  let rewardPerDeliveryKwd: number | null = null;
  let tiers: TierInput[] = [];

  if (targetMode === "single") {
    const target = Number(targetRaw);
    if (!Number.isFinite(target) || target <= baseMinimum) return { error: "invalid_target" };
    if (payoutMode === "cumulative" && rewardMode === "fixed") {
      // Cumulative + fixed pays as soon as eligible > base; target still required for validation
    }
    targetDeliveries = target;
    if (rewardMode !== "fixed" && rewardMode !== "per_delivery") {
      return { error: "invalid_reward_mode" };
    }
    if (rewardMode === "fixed") {
      const reward = Number(rewardRaw);
      if (!Number.isFinite(reward) || reward < 0) return { error: "invalid_reward" };
      rewardKwd = reward;
    } else {
      const rate = Number(perDeliveryRaw);
      if (!Number.isFinite(rate) || rate < 0) return { error: "invalid_reward" };
      rewardPerDeliveryKwd = rate;
    }
  } else {
    const parsedTiers = parseTiersJson(tiersRaw);
    if ("error" in parsedTiers) return { error: parsedTiers.error };
    tiers = parsedTiers;
    if (tiers[0].threshold_deliveries <= baseMinimum) return { error: "invalid_tiers" };
  }

  const supabase = await createClient();
  const payload = {
    name,
    status,
    scope_type: scope.scopeType,
    zone_id: scope.zoneId,
    partner_id: scope.partnerId,
    restaurant_id: scope.restaurantId,
    period,
    target_mode: targetMode,
    base_minimum_deliveries: baseMinimum,
    target_deliveries: targetMode === "single" ? targetDeliveries : null,
    reward_mode: targetMode === "single" ? rewardMode : "fixed",
    reward_kwd: targetMode === "single" && rewardMode === "fixed" ? rewardKwd : 0,
    reward_per_delivery_kwd:
      targetMode === "single" && rewardMode === "per_delivery"
        ? rewardPerDeliveryKwd
        : null,
    payout_mode: payoutMode,
    overrides_others: overridesOthers,
    start_date: dates.startDate,
    end_date: dates.endDate,
    priority,
    updated_at: new Date().toISOString(),
  };

  let ruleId = id;

  if (id) {
    const { error } = await supabase.from("incentive_rules").update(payload).eq("id", id);
    if (error) return { error: "save_failed" };
  } else {
    const { data, error } = await supabase
      .from("incentive_rules")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: "save_failed" };
    ruleId = data.id;
  }

  const { error: deleteTiersError } = await supabase
    .from("incentive_rule_tiers")
    .delete()
    .eq("incentive_rule_id", ruleId);
  if (deleteTiersError) return { error: "save_failed" };

  if (targetMode === "tiered" && tiers.length > 0) {
    const tierRows = tiers.map((tier, index) => ({
      incentive_rule_id: ruleId,
      sort_order: index,
      threshold_deliveries: tier.threshold_deliveries,
      reward_mode: tier.reward_mode,
      reward_kwd: tier.reward_mode === "fixed" ? tier.reward_kwd : null,
      reward_per_delivery_kwd:
        tier.reward_mode === "per_delivery" ? tier.reward_per_delivery_kwd : null,
    }));
    const { error: insertTiersError } = await supabase
      .from("incentive_rule_tiers")
      .insert(tierRows);
    if (insertTiersError) return { error: "save_failed" };
  }

  return { success: true, id: ruleId };
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
