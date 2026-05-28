"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  deleteDelivery,
  fetchDeliveriesForAdmin,
  updateDeliveryStatus,
} from "./deliveries-actions";
import type { ReviewableDeliveryStatus } from "./types";
import type { DeliveryListRow } from "./types";

export type DeliveriesTabFilter =
  | "all"
  | "active"
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "cancelled";

export async function fetchDeliveriesList(): Promise<DeliveryListRow[]> {
  return fetchDeliveriesForAdmin();
}

export function useDeliveriesList() {
  return useQuery({
    queryKey: queryKeys.deliveries.list(),
    queryFn: fetchDeliveriesList,
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryId,
      status,
      rejectionReason,
    }: {
      deliveryId: string;
      status: ReviewableDeliveryStatus;
      rejectionReason?: string;
    }) => updateDeliveryStatus(deliveryId, status, rejectionReason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
    },
  });
}

export function useDeleteDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => deleteDelivery(deliveryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}
