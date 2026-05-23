"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSnapshot } from "./dashboard-actions";
import type { DashboardSnapshot } from "./types";

export function useDashboardSnapshot(initialData: DashboardSnapshot) {
  return useQuery({
    queryKey: ["dashboard", "snapshot", initialData.today],
    queryFn: () => fetchDashboardSnapshot(),
    initialData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
