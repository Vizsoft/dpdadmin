"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchDeliveriesForAdmin } from "./deliveries-actions";
import type { DeliveryListRow } from "./types";

export type DeliveriesTabFilter = "all" | "pending" | "verified" | "rejected";

export async function fetchDeliveriesList(): Promise<DeliveryListRow[]> {
  return fetchDeliveriesForAdmin();
}

export function useDeliveriesList() {
  return useQuery({
    queryKey: queryKeys.deliveries.list(),
    queryFn: fetchDeliveriesList,
  });
}
