"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  fetchDeliveriesForAdmin,
  rejectDelivery,
  verifyDelivery,
} from "./deliveries-actions";
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

export function useVerifyDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => verifyDelivery(deliveryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export function useRejectDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, reason }: { deliveryId: string; reason: string }) =>
      rejectDelivery(deliveryId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}
