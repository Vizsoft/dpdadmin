"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Button } from "@/components/ui/button";
import type { DashboardSnapshot } from "./types";
import { useDashboardSnapshot } from "./use-dashboard";
import { DashboardKpiBar } from "./widgets/dashboard-kpi-bar";
import { PresenceMapWidget } from "./widgets/presence-map-widget";
import { AlertsCenterWidget } from "./widgets/alerts-center-widget";
import { WorkforceQueueWidget } from "./widgets/workforce-queue-widget";
import { DeliveryMonitorWidget } from "./widgets/delivery-monitor-widget";
import { EarningsWatchWidget } from "./widgets/earnings-watch-widget";
import { CompliancePanelWidget } from "./widgets/compliance-panel-widget";
import { AttendanceMonitorWidget } from "./widgets/attendance-monitor-widget";
import { PartnerHealthWidget } from "./widgets/partner-health-widget";
import { ActivityTimelineWidget } from "./widgets/activity-timeline-widget";

export function DashboardPageShell({
  initialSnapshot,
  locale,
}: {
  initialSnapshot: DashboardSnapshot;
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");
  const { data, isFetching, refetch } = useDashboardSnapshot(initialSnapshot);

  const snapshot = data ?? initialSnapshot;
  const perms = snapshot.permissions;

  return (
    <AppPage>
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 rounded-lg"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        }
      />

      <div className="space-y-4">
        <DashboardKpiBar kpis={snapshot.kpis} />

        <div className="grid gap-4 lg:grid-cols-2">
          <PresenceMapWidget locale={locale} />
          <AlertsCenterWidget snapshot={snapshot} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {perms.drivers ? (
            <WorkforceQueueWidget rows={snapshot.workforceQueue} locale={locale} />
          ) : null}
          {perms.deliveries ? (
            <DeliveryMonitorWidget
              metrics={snapshot.deliveryMetrics}
              feed={snapshot.deliveryFeed}
              locale={locale}
            />
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {perms.earnings ? (
            <EarningsWatchWidget rows={snapshot.earningsWatch} locale={locale} />
          ) : null}
          <CompliancePanelWidget snapshot={snapshot} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {perms.attendance ? (
            <AttendanceMonitorWidget rows={snapshot.attendanceMonitor} locale={locale} />
          ) : null}
          {perms.drivers ? (
            <PartnerHealthWidget cards={snapshot.partnerHealth} locale={locale} />
          ) : null}
        </div>

        <ActivityTimelineWidget items={snapshot.activityTimeline} />
      </div>
    </AppPage>
  );
}
