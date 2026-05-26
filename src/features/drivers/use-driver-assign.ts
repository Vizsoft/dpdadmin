"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  assignDriverToRestaurant,
  assignDriverToZone,
  fetchDriverAssignmentPreview,
  fetchRestaurantAssignedDriversForAssign,
  fetchZoneAssignedDriversForAssign,
  searchDriversForAssign,
  unassignDriverFromRestaurant,
} from "./driver-assign-actions";

export function useRestaurantAssignDrivers(restaurantId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.drivers.assignRestaurant(restaurantId ?? ""),
    queryFn: () => fetchRestaurantAssignedDriversForAssign(restaurantId!),
    enabled: Boolean(restaurantId) && enabled,
  });
}

export function useZoneAssignDrivers(zoneId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.drivers.assignZone(zoneId ?? ""),
    queryFn: () => fetchZoneAssignedDriversForAssign(zoneId!),
    enabled: Boolean(zoneId) && enabled,
  });
}

export function useDriverAssignmentPreview(driverId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.drivers.assignPreview(driverId ?? ""),
    queryFn: () => fetchDriverAssignmentPreview(driverId!),
    enabled: Boolean(driverId) && enabled,
  });
}

export function useSearchDriversForAssign(query: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.drivers.assignSearch(query),
    queryFn: () => searchDriversForAssign(query),
    enabled: enabled && query.trim().length >= 2,
  });
}

function invalidateAssignQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.drivers.all() });
  void qc.invalidateQueries({ queryKey: queryKeys.restaurants.all() });
  void qc.invalidateQueries({ queryKey: queryKeys.zones.all() });
}

export function useAssignDriverToRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignDriverToRestaurant,
    onSuccess: () => invalidateAssignQueries(qc),
  });
}

export function useAssignDriverToZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignDriverToZone,
    onSuccess: () => invalidateAssignQueries(qc),
  });
}

export function useUnassignDriverFromRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unassignDriverFromRestaurant,
    onSuccess: () => invalidateAssignQueries(qc),
  });
}
