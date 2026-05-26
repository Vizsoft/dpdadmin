"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  deleteDelivery,
  fetchDeliveriesForAdmin,
  rejectDelivery,
  updateDeliveryStatus,
  verifyDelivery,
} from "./deliveries-actions";
import type { ReviewableDeliveryStatus } from "./types";
import type { DeliveryListRow } from "./types";

export type DeliveriesTabFilter =
  | "all"
  | "active"
  | "pending"
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

export function useVerifyDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deliveryId: string) => verifyDelivery(deliveryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
    },
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
