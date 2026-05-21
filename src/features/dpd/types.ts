import type { Database } from "@/types/database";

export type RuleScopeType = Database["public"]["Enums"]["rule_scope_type"];
export type RuleStatus = Database["public"]["Enums"]["rule_status"];
export type IncentivePeriod = Database["public"]["Enums"]["incentive_period"];

export const RULE_SCOPE_TYPES: RuleScopeType[] = ["zone", "partner", "restaurant"];
export const RULE_STATUSES: RuleStatus[] = ["draft", "active", "ended"];
export const INCENTIVE_PERIODS: IncentivePeriod[] = ["daily", "weekly", "monthly"];

export type RestaurantRow = {
  id: string;
  partner_id: string;
  partner_name: string;
  name: string;
  external_merchant_id: string | null;
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
  target_deliveries: number;
  reward_kwd: number;
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

export type EarningsPreviewRow = {
  driver_id: string;
  deliveries: number;
  incentive_kwd: number;
  rules: {
    rule_id: string;
    rule_name: string;
    period: string;
    eligible_count: number;
    target: number;
    reward_kwd: number;
  }[];
};

export type EarningsPreviewResult = {
  earn_date: string;
  drivers: EarningsPreviewRow[];
};
