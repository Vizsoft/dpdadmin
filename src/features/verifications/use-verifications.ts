"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  applyImportBatch,
  createVerification,
  deleteVerification,
  fetchDriverAssignedRestaurants,
  fetchVerificationDetail,
  fetchVerificationDriverOptions,
  listImportBatches,
  listVerifications,
  reconcileVerification,
  resolveImportPreview,
  revertImportBatch,
  updateVerification,
} from "./verifications-actions";
import type {
  ImportMappedRow,
  ImportPreviewRow,
  VerificationListFilters,
} from "./types";

export function useInfiniteVerifications(filters: VerificationListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.verifications.list(filters),
    queryFn: ({ pageParam }) =>
      listVerifications({
        filters,
        cursor: pageParam ?? null,
      }),
    initialPageParam: null as { service_date: string; id: string } | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useVerificationDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.verifications.detail(id ?? ""),
    queryFn: () => (id ? fetchVerificationDetail(id) : null),
    enabled: Boolean(id),
  });
}

export function useVerificationDriverOptions(search: string) {
  return useQuery({
    queryKey: [...queryKeys.verifications.lookup(), search],
    queryFn: () => fetchVerificationDriverOptions(search),
  });
}

export function useDriverAssignedRestaurants(driverId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.verifications.lookup(), "driver-restaurants", driverId ?? ""],
    queryFn: () => (driverId ? fetchDriverAssignedRestaurants(driverId) : []),
    enabled: Boolean(driverId),
    staleTime: 60_000,
  });
}

export function useImportBatches() {
  return useQuery({
    queryKey: queryKeys.verifications.importBatches(),
    queryFn: listImportBatches,
  });
}

export function useCreateVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export function useUpdateVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export function useReconcileVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reconcileVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export function useDeleteVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVerification,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
    },
  });
}

export function useResolveImportPreview() {
  return useMutation({
    mutationFn: (rows: ImportMappedRow[]) => resolveImportPreview(rows),
  });
}

export function useApplyImportBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyImportBatch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export function useRevertImportBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertImportBatch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.verifications.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.all() });
    },
  });
}

export type { ImportPreviewRow };
