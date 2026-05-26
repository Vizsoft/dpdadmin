"use client";

import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Button } from "@/components/ui/button";
import type { DashboardSnapshot } from "./types";
import { useDashboardSnapshot } from "./use-dashboard";
import { AdminKpiBar } from "./widgets/admin-kpi-bar";
import { AdminActionQueueWidget } from "./widgets/admin-action-queue-widget";
import { AccessRequestsWidget } from "./widgets/access-requests-widget";
import { PayrollReadinessWidget } from "./widgets/payroll-readiness-widget";
import { SystemStatusBanner } from "./widgets/system-status-banner";
import { DeliveryMonitorWidget } from "./widgets/delivery-monitor-widget";
import { AttendanceMonitorWidget } from "./widgets/attendance-monitor-widget";
import { FleetOpsWidget } from "./widgets/fleet-ops-widget";
import { PartnerHealthWidget } from "./widgets/partner-health-widget";
import { WorkforceQueueWidget } from "./widgets/workforce-queue-widget";

export function DashboardPageShell({
  initialSnapshot,
  locale,
}: {
  initialSnapshot: DashboardSnapshot;
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");
  const { data, isFetching, refetch } = useDashboardSnapshot(initialSnapshot, locale);

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
        {perms.superAdmin ? (
          <SystemStatusBanner status={snapshot.systemStatus} locale={locale} />
        ) : null}

        <AdminKpiBar kpis={snapshot.kpis} />

        {perms.attendance ? <FleetOpsWidget /> : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <AdminActionQueueWidget items={snapshot.adminActionQueue} locale={locale} />

          {perms.superAdmin ? (
            <AccessRequestsWidget rows={snapshot.accessRequests} locale={locale} />
          ) : perms.earnings ? (
            <PayrollReadinessWidget summary={snapshot.payrollReadiness} locale={locale} />
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {perms.deliveries ? (
            <DeliveryMonitorWidget
              metrics={snapshot.deliveryMetrics}
              feed={snapshot.deliveryFeed}
              locale={locale}
            />
          ) : null}
          {perms.earnings ? (
            <PayrollReadinessWidget summary={snapshot.payrollReadiness} locale={locale} />
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {perms.drivers ? (
            <WorkforceQueueWidget rows={snapshot.workforceQueue} locale={locale} />
          ) : null}
          {perms.attendance ? (
            <AttendanceMonitorWidget rows={snapshot.attendanceMonitor} locale={locale} />
          ) : null}
        </div>

        {perms.drivers ? (
          <PartnerHealthWidget cards={snapshot.partnerHealth} locale={locale} />
        ) : null}
      </div>
    </AppPage>
  );
}
