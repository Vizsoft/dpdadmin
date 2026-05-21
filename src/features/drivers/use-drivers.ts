"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchDriverDetail, fetchDriversForAdmin } from "./drivers-actions";
import type { DriverListRow } from "./types";

export type DriversTabFilter = "all" | "pending" | "on_duty";

export async function fetchDriversList(): Promise<DriverListRow[]> {
  return fetchDriversForAdmin();
}

export function useDriversList() {
  return useQuery({
    queryKey: queryKeys.drivers.list(),
    queryFn: fetchDriversList,
  });
}

export function useDriverDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(id),
    queryFn: () => fetchDriverDetail(id),
    enabled: Boolean(id),
  });
}
