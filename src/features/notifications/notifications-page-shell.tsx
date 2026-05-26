"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  Copy,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Workflow,
} from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { cloneNotificationCampaign } from "./notifications-actions";
import { useNotificationCampaigns, useNotificationDashboard } from "./use-notifications";
import type { NotificationCampaignStatus } from "./types";

function statusVariant(
  status: NotificationCampaignStatus,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "sent" || status === "delivered" || status === "opened" || status === "clicked") {
    return "success";
  }
  if (status === "failed" || status === "cancelled" || status === "expired") return "danger";
  if (status === "pending_approval" || status === "scheduled" || status === "queued") {
    return "warning";
  }
  return "neutral";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuwait",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function NotificationsPageShell() {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const auth = useAuth();
  const canManage = auth.can("notifications.manage");

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKpis } = useNotificationDashboard();
  const { data: campaigns, isLoading, refetch } = useNotificationCampaigns({});

  const quickLinks = [
    ...(canManage
      ? [{ href: "/notifications/new", label: t("navCreate"), icon: Plus }]
      : []),
    { href: "/notifications/history", label: t("navHistory"), icon: History },
    { href: "/notifications/templates", label: t("navTemplates"), icon: Sparkles },
    { href: "/notifications/automations", label: t("navAutomations"), icon: Workflow },
    { href: "/notifications/analytics", label: t("navAnalytics"), icon: BarChart3 },
  ];

  return (
    <AppPage>
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          canManage ? (
            <Button render={<Link href={`/${locale}/notifications/new`} />} className="h-9 cursor-pointer rounded-lg">
              <Plus className="size-4" />
              {t("createNotification")}
            </Button>
          ) : null
        }
      />

      <KpiGrid
        items={[
          { label: t("kpiSent"), value: kpisLoading ? "…" : String(kpis?.sentToday ?? 0) },
          { label: t("kpiScheduled"), value: kpisLoading ? "…" : String(kpis?.scheduled ?? 0) },
          { label: t("kpiDrafts"), value: kpisLoading ? "…" : String(kpis?.drafts ?? 0) },
          {
            label: t("kpiDeliveryRate"),
            value: kpisLoading ? "…" : `${kpis?.deliveryRate ?? 0}%`,
          },
          {
            label: t("kpiOpenRate"),
            value: kpisLoading ? "…" : `${kpis?.openRate ?? 0}%`,
          },
          { label: t("kpiFailed"), value: kpisLoading ? "…" : String(kpis?.failedDeliveries ?? 0) },
          {
            label: t("kpiAutomations"),
            value: kpisLoading ? "…" : String(kpis?.activeAutomations ?? 0),
          },
          {
            label: t("kpiActivity"),
            value: kpisLoading ? "…" : String(kpis?.recentActivity ?? 0),
          },
        ]}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={`/${locale}${link.href}`}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm transition hover:border-primary/30 hover:bg-primary/5"
          >
            <link.icon className="size-4 text-primary" />
            {link.label}
          </Link>
        ))}
      </div>

      <AppListCard
        title={t("recentCampaigns")}
        headerActions={
          <Button
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer"
            onClick={() => {
              void refetch();
              void refetchKpis();
            }}
          >
            <RefreshCw className="size-4" />
            {t("refresh")}
          </Button>
        }
      >
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : !campaigns?.length ? (
            <AppEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colTitle")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colCategory")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colAudience")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colSent")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.slice(0, 20).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/${locale}/notifications/${row.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {row.title}
                      </Link>
                      <p className="text-xs text-muted-foreground line-clamp-1">{row.body}</p>
                    </TableCell>
                    <TableCell className="capitalize">{row.category.replace("_", " ")}</TableCell>
                    <TableCell>{row.estimated_audience_count || row.recipient_count || 0}</TableCell>
                    <TableCell>
                      <StatusPill variant={statusVariant(row.status)}>
                        {row.status.replace("_", " ")}
                      </StatusPill>
                    </TableCell>
                    <TableCell>{formatDateTime(row.sent_at ?? row.scheduled_for)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          render={<Link href={`/${locale}/notifications/${row.id}`} />}
                          variant="ghost"
                          size="sm"
                          className="h-8 cursor-pointer text-primary"
                        >
                          <Send className="size-3.5" />
                        </Button>
                        {canManage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 cursor-pointer"
                            onClick={() => void cloneNotificationCampaign(row.id).then(() => refetch())}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </AppListCard>
    </AppPage>
  );
}
