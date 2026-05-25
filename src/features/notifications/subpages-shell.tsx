"use client";

import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppListCard } from "@/components/app/app-list-card";
import { CardContent } from "@/components/ui/card";
import {
  useNotificationAutomations,
  useNotificationDashboard,
  useNotificationTemplates,
} from "@/features/notifications/use-notifications";

export function NotificationTemplatesPageShell() {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const { data, isLoading } = useNotificationTemplates();

  return (
    <AppPage>
      <AppPageHeader
        title={t("navTemplates")}
        description={t("templatesSubtitle")}
        breadcrumbs={[
          { label: t("title"), href: `/${locale}/notifications` },
          { label: t("navTemplates") },
        ]}
      />
      <AppListCard title={t("navTemplates")}>
        <CardContent className="space-y-2 p-4">
          {isLoading ? (
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">{t("templatesEmpty")}</p>
          ) : (
            data.map((tpl) => (
              <div key={tpl.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-semibold">{tpl.name}</p>
                <p className="text-xs text-muted-foreground">{tpl.title_template}</p>
              </div>
            ))
          )}
        </CardContent>
      </AppListCard>
    </AppPage>
  );
}

export function NotificationAutomationsPageShell() {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const { data, isLoading } = useNotificationAutomations();

  return (
    <AppPage>
      <AppPageHeader
        title={t("navAutomations")}
        description={t("automationsSubtitle")}
        breadcrumbs={[
          { label: t("title"), href: `/${locale}/notifications` },
          { label: t("navAutomations") },
        ]}
      />
      <AppListCard title={t("navAutomations")}>
        <CardContent className="space-y-2 p-4">
          {isLoading ? (
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground">{t("automationsEmpty")}</p>
          ) : (
            data.map((row) => (
              <div key={row.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {row.trigger_type.replace("_", " ")} · {row.status}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </AppListCard>
    </AppPage>
  );
}

export function NotificationAnalyticsPageShell() {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const { data: kpis, isLoading } = useNotificationDashboard();

  return (
    <AppPage>
      <AppPageHeader
        title={t("navAnalytics")}
        description={t("analyticsSubtitle")}
        breadcrumbs={[
          { label: t("title"), href: `/${locale}/notifications` },
          { label: t("navAnalytics") },
        ]}
      />
      <AppListCard title={t("navAnalytics")}>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("kpiSent"), value: kpis?.sentToday ?? 0 },
            { label: t("kpiDeliveryRate"), value: `${kpis?.deliveryRate ?? 0}%` },
            { label: t("kpiOpenRate"), value: `${kpis?.openRate ?? 0}%` },
            { label: t("kpiFailed"), value: kpis?.failedDeliveries ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold">{isLoading ? "…" : item.value}</p>
            </div>
          ))}
        </CardContent>
      </AppListCard>
    </AppPage>
  );
}
