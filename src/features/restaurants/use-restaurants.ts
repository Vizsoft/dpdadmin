"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  fetchRestaurantPartnerOptions,
  fetchRestaurantZoneOptions,
  fetchRestaurantsForAdmin,
} from "./restaurants-actions";

export function useRestaurantsList() {
  return useQuery({
    queryKey: queryKeys.restaurants.list(),
    queryFn: fetchRestaurantsForAdmin,
  });
}

export function useRestaurantPartnerOptions() {
  return useQuery({
    queryKey: queryKeys.restaurants.partnerOptions(),
    queryFn: fetchRestaurantPartnerOptions,
  });
}

export function useRestaurantZoneOptions() {
  return useQuery({
    queryKey: queryKeys.restaurants.zoneOptions(),
    queryFn: fetchRestaurantZoneOptions,
  });
}
