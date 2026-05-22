"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  fetchDriverDetail,
  fetchDriversForAdmin,
  regenerateDriverPasscode,
} from "./drivers-actions";
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

export function useRegenerateDriverPasscode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driverId: string) => {
      const result = await regenerateDriverPasscode(driverId);
      if ("error" in result) throw new Error(result.error);
      return result.passcode;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });
}
