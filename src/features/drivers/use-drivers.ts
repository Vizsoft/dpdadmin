"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  archiveDriverIntake,
  fetchDriverDetail,
  fetchDriverDeviceOverview,
  fetchDriverDocuments,
  fetchDriversForAdmin,
  fetchDriversMultiDeviceRecent,
  forceSignOutDriver,
  regenerateDriverPasscode,
} from "./drivers-actions";
import {
  applyDriverImportBatch,
  approveDriverIntake,
  resolveDriverImportPreview,
} from "./drivers-import-actions";
import type { DriverImportPreviewRow, DriverListRow } from "./types";

export type { DriverImportPreviewRow };

export type DriversTabFilter = "all" | "pending" | "on_duty" | "archived" | "multi_device";

export async function fetchDriversList(archived = false): Promise<DriverListRow[]> {
  return fetchDriversForAdmin({ archived });
}

export function useDriversList(archived = false) {
  return useQuery({
    queryKey: queryKeys.drivers.list({ archived }),
    queryFn: () => fetchDriversList(archived),
  });
}

export function useDriverDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.drivers.detail(id),
    queryFn: () => fetchDriverDetail(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useDriverDocuments(
  intakeId: string,
  profileId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.drivers.documents(intakeId, profileId),
    queryFn: () => fetchDriverDocuments(intakeId, profileId),
    enabled: enabled && Boolean(intakeId),
    staleTime: 5 * 60_000,
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

export function useArchiveDriverIntake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (intakeId: string) => {
      const result = await archiveDriverIntake(intakeId);
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });
}

export function useApproveDriverIntake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (intakeId: string) => {
      const result = await approveDriverIntake(intakeId);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });
}

export function useResolveDriverImportPreview() {
  return useMutation({
    mutationFn: resolveDriverImportPreview,
  });
}

export function useApplyDriverImportBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyDriverImportBatch,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });
}

export function useDriverDeviceOverview(driverId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.drivers.devices(driverId),
    queryFn: () => fetchDriverDeviceOverview(driverId),
    enabled: enabled && Boolean(driverId),
    staleTime: 30_000,
  });
}

export function useForceSignOutDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driverId: string) => {
      const result = await forceSignOutDriver(driverId);
      if ("error" in result) throw new Error(result.error);
      return result;
    },
    onSuccess: (_data, driverId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.devices(driverId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });
}

export function useDriversMultiDeviceRecent(days = 7, enabled = true) {
  return useQuery({
    queryKey: queryKeys.drivers.multiDeviceRecent(days),
    queryFn: () => fetchDriversMultiDeviceRecent(days),
    enabled,
    staleTime: 120_000,
  });
}
