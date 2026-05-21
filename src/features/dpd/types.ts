import type { Database } from "@/types/database";
import type { RestaurantStatus } from "@/features/restaurants/restaurant-status";

export type RuleScopeType = Database["public"]["Enums"]["rule_scope_type"];
export type RuleStatus = Database["public"]["Enums"]["rule_status"];
export type IncentivePeriod = Database["public"]["Enums"]["incentive_period"];
export type IncentiveTargetMode = Database["public"]["Enums"]["incentive_target_mode"];
export type IncentiveRewardMode = Database["public"]["Enums"]["incentive_reward_mode"];

export const RULE_SCOPE_TYPES: RuleScopeType[] = ["zone", "partner", "restaurant"];
export const RULE_STATUSES: RuleStatus[] = ["draft", "active", "ended"];
export const INCENTIVE_PERIODS: IncentivePeriod[] = ["daily", "weekly", "monthly"];
export const INCENTIVE_TARGET_MODES: IncentiveTargetMode[] = ["single", "tiered"];
export const INCENTIVE_REWARD_MODES: IncentiveRewardMode[] = ["fixed", "per_delivery"];

export type RestaurantRow = {
  id: string;
  partner_id: string;
  partner_name: string;
  zone_id: string | null;
  zone_name: string;
  name: string;
  external_merchant_id: string | null;
  map_link: string | null;
  status: RestaurantStatus;
  is_active: boolean;
  created_at: string;
};

export type DeliveryRuleRow = {
  id: string;
  name: string;
  status: RuleStatus;
  scope_type: RuleScopeType;
  zone_id: string | null;
  partner_id: string | null;
  restaurant_id: string | null;
  scope_label: string;
  start_date: string;
  end_date: string;
  priority: number;
};

export type IncentiveRuleTierRow = {
  id: string;
  threshold_deliveries: number;
  reward_mode: IncentiveRewardMode;
  reward_kwd: number | null;
  reward_per_delivery_kwd: number | null;
  sort_order: number;
};

export type IncentiveRuleRow = {
  id: string;
  name: string;
  status: RuleStatus;
  scope_type: RuleScopeType;
  zone_id: string | null;
  partner_id: string | null;
  restaurant_id: string | null;
  scope_label: string;
  period: IncentivePeriod;
  target_mode: IncentiveTargetMode;
  base_minimum_deliveries: number;
  target_deliveries: number | null;
  reward_mode: IncentiveRewardMode;
  reward_kwd: number;
  reward_per_delivery_kwd: number | null;
  tiers: IncentiveRuleTierRow[];
  start_date: string;
  end_date: string;
  priority: number;
};

export type DpdScopeOptions = {
  zones: { id: string; name: string; code: string }[];
  partners: { id: string; name: string }[];
  restaurants: { id: string; name: string; partner_id: string; partner_name: string }[];
};

export type DeliveryValidationResult = {
  eligible: boolean;
  matchedRuleIds: string[];
  reasons: string[];
};

export type EarningsPreviewRuleBreakdown = {
  rule_id: string;
  rule_name: string;
  period: string;
  eligible_count: number;
  target_mode?: string;
  base_minimum?: number;
  target?: number | null;
  reward_mode?: string;
  reward_kwd?: number;
  amount_kwd?: number;
  tiers?: { threshold: number; reward_mode: string; met: boolean }[];
};

export type EarningsPreviewRow = {
  driver_id: string;
  deliveries: number;
  incentive_kwd: number;
  rules: EarningsPreviewRuleBreakdown[];
};

export type EarningsPreviewResult = {
  earn_date: string;
  drivers: EarningsPreviewRow[];
};

/** Client-side payout estimate (matches SQL compute_incentive_amount). */
export function computeIncentivePreview(
  rule: Pick<
    IncentiveRuleRow,
    | "target_mode"
    | "base_minimum_deliveries"
    | "target_deliveries"
    | "reward_mode"
    | "reward_kwd"
    | "reward_per_delivery_kwd"
    | "tiers"
  >,
  eligibleCount: number,
): number {
  const base = rule.base_minimum_deliveries;
  if (eligibleCount < base) return 0;

  if (rule.target_mode === "single") {
    const target = rule.target_deliveries;
    if (target == null || eligibleCount < target) return 0;
    if (rule.reward_mode === "fixed") return rule.reward_kwd;
    const rate = rule.reward_per_delivery_kwd ?? 0;
    const band = Math.min(eligibleCount - base, target - base);
    return rate * Math.max(band, 0);
  }

  let total = 0;
  const tiers = [...rule.tiers].sort(
    (a, b) => a.threshold_deliveries - b.threshold_deliveries,
  );
  for (const tier of tiers) {
    if (eligibleCount < tier.threshold_deliveries) continue;
    if (tier.reward_mode === "fixed") {
      total += tier.reward_kwd ?? 0;
    } else {
      const rate = tier.reward_per_delivery_kwd ?? 0;
      const band = Math.min(
        eligibleCount - base,
        tier.threshold_deliveries - base,
      );
      total += rate * Math.max(band, 0);
    }
  }
  return total;
}

export function formatIncentiveTargetSummary(
  rule: IncentiveRuleRow,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (rule.target_mode === "tiered") {
    const thresholds = rule.tiers.map((x) => x.threshold_deliveries).join(", ");
    return t("targetSummaryTiered", {
      count: rule.tiers.length,
      thresholds: thresholds || "—",
    });
  }
  const base = rule.base_minimum_deliveries;
  const target = rule.target_deliveries ?? 0;
  if (base > 0) {
    return t("targetSummarySingleRange", { base, target });
  }
  return String(target);
}

export function formatIncentiveRewardSummary(
  rule: IncentiveRuleRow,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (rule.target_mode === "tiered") {
    const parts = rule.tiers.map((tier) => {
      if (tier.reward_mode === "fixed") {
        return `${tier.threshold_deliveries}: ${tier.reward_kwd ?? 0}`;
      }
      return `${tier.threshold_deliveries}: ${tier.reward_per_delivery_kwd ?? 0}/${t("perDeliveryShort")}`;
    });
    return parts.join(" + ") || "—";
  }
  if (rule.reward_mode === "per_delivery") {
    return t("rewardSummaryPerDelivery", {
      rate: rule.reward_per_delivery_kwd ?? 0,
    });
  }
  return String(rule.reward_kwd);
}
