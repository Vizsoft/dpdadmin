"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  getNotificationCampaign,
  getNotificationDashboardKpis,
  getNotificationTargetingOptions,
  listNotificationAutomations,
  listNotificationCampaigns,
  listNotificationTemplates,
} from "./notifications-actions";
import type { NotificationListFilters } from "./types";

export function useNotificationDashboard() {
  return useQuery({
    queryKey: queryKeys.notifications.dashboard(),
    queryFn: () => getNotificationDashboardKpis(),
  });
}

export function useNotificationCampaigns(filters: NotificationListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => listNotificationCampaigns(filters),
  });
}

export function useNotificationCampaign(id: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id ?? ""),
    queryFn: () => getNotificationCampaign(id!),
    enabled: Boolean(id),
  });
}

export function useNotificationTemplates() {
  return useQuery({
    queryKey: queryKeys.notifications.templates(),
    queryFn: () => listNotificationTemplates(),
  });
}

export function useNotificationAutomations() {
  return useQuery({
    queryKey: queryKeys.notifications.automations(),
    queryFn: () => listNotificationAutomations(),
  });
}

export function useNotificationTargetingOptions() {
  return useQuery({
    queryKey: queryKeys.notifications.targetingOptions(),
    queryFn: () => getNotificationTargetingOptions(),
  });
}
