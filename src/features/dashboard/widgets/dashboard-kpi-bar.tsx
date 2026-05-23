"use client";

import { useTranslations } from "next-intl";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { DashboardKpis } from "../types";

export function DashboardKpiBar({ kpis }: { kpis: DashboardKpis }) {
  const t = useTranslations("pages.dashboard");

  const items = [
    { label: t("kpiTotalDrivers"), value: kpis.totalDrivers },
    { label: t("kpiOnlineNow"), value: kpis.onlineNow },
    { label: t("kpiOnShift"), value: kpis.onShift },
    { label: t("kpiTrackedNow"), value: kpis.trackedNow },
    { label: t("kpiCheckedIn"), value: kpis.checkedInToday },
    { label: t("kpiNotReported"), value: kpis.notReportedYet },
    { label: t("kpiRestaurantAssigned"), value: kpis.restaurantAssigned },
    { label: t("kpiSuspended"), value: kpis.suspendedArchived },
    { label: t("kpiDeliveriesToday"), value: kpis.deliveriesToday },
    {
      label: t("kpiEstimatedPayout"),
      value: `${kpis.estimatedPayoutToday.toFixed(3)} KWD`,
    },
  ];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[720px] grid-cols-2 gap-4 sm:min-w-0 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {items.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>
    </div>
  );
}
