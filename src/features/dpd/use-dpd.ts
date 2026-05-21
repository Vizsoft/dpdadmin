"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  fetchDeliveryRulesForAdmin,
  fetchDpdScopeOptions,
  fetchIncentiveRulesForAdmin,
  fetchRestaurantsForAdmin,
} from "./dpd-actions";

export function useDpdScopeOptions() {
  return useQuery({
    queryKey: queryKeys.dpd.scopeOptions(),
    queryFn: fetchDpdScopeOptions,
  });
}

export function useRestaurants() {
  return useQuery({
    queryKey: queryKeys.dpd.restaurants(),
    queryFn: fetchRestaurantsForAdmin,
  });
}

export function useDeliveryRules() {
  return useQuery({
    queryKey: queryKeys.dpd.deliveryRules(),
    queryFn: fetchDeliveryRulesForAdmin,
  });
}

export function useIncentiveRules() {
  return useQuery({
    queryKey: queryKeys.dpd.incentiveRules(),
    queryFn: fetchIncentiveRulesForAdmin,
  });
}
