"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDriverLocationHistory } from "@/features/locations/locations-actions";
import { queryKeys } from "@/lib/query/query-keys";

function dayBounds(date: string): { from: string; to: string } {
  return {
    from: `${date}T00:00:00+03:00`,
    to: `${date}T23:59:59.999+03:00`,
  };
}

export function useLiveHistory(driverId: string | null, date: string) {
  return useQuery({
    queryKey: queryKeys.liveTracking.history(driverId ?? "", date),
    queryFn: async () => {
      if (!driverId) return [];
      const { from, to } = dayBounds(date);
      return fetchDriverLocationHistory(driverId, from, to);
    },
    enabled: Boolean(driverId && date),
  });
}
