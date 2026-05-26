"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import {
  getNotificationAutomation,
  getNotificationCampaign,
  getNotificationDashboardKpis,
  getNotificationTemplate,
  getNotificationTargetingOptions,
  listNotificationAnalyticsDaily,
  listNotificationAutomations,
  listNotificationAutomationRuns,
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

export function useNotificationTemplate(id: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.templateDetail(id ?? ""),
    queryFn: () => getNotificationTemplate(id!),
    enabled: Boolean(id),
  });
}

export function useNotificationAutomations() {
  return useQuery({
    queryKey: queryKeys.notifications.automations(),
    queryFn: () => listNotificationAutomations(),
  });
}

export function useNotificationAutomation(id: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.automationDetail(id ?? ""),
    queryFn: () => getNotificationAutomation(id!),
    enabled: Boolean(id),
  });
}

export function useNotificationAutomationRuns(automationId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.notifications.automationDetail(automationId ?? ""), "runs"],
    queryFn: () => listNotificationAutomationRuns(automationId!),
    enabled: Boolean(automationId),
  });
}

export function useNotificationAnalyticsDaily(filters: { fromDate?: string; toDate?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.analyticsDaily(filters),
    queryFn: () => listNotificationAnalyticsDaily(filters),
  });
}

export function useNotificationTargetingOptions() {
  return useQuery({
    queryKey: queryKeys.notifications.targetingOptions(),
    queryFn: () => getNotificationTargetingOptions(),
  });
}
