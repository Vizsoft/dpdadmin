"use client";

import {
  AlertTriangle,
  ClipboardX,
  ShieldAlert,
  UserMinus,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { MetricTile } from "@/components/ui/metric-tile";
import type { DashboardKpis } from "../types";

export function AdminKpiBar({ kpis }: { kpis: DashboardKpis }) {
  const t = useTranslations("pages.dashboard");

  const items = [
    {
      label: t("kpiPendingAccess"),
      value: kpis.pendingAccessRequests,
      icon: UserPlus,
      tone: kpis.pendingAccessRequests > 0 ? ("amber" as const) : ("slate" as const),
    },
    {
      label: t("kpiVerificationBacklog"),
      value: kpis.verificationBacklog,
      icon: ClipboardX,
      tone: kpis.verificationBacklog > 0 ? ("amber" as const) : ("slate" as const),
    },
    {
      label: t("kpiDeliveryReview"),
      value: kpis.deliveryReviewPending,
      icon: ShieldAlert,
      tone: kpis.deliveryReviewPending > 0 ? ("rose" as const) : ("slate" as const),
    },
    {
      label: t("kpiPayrollBlockers"),
      value: kpis.payrollBlockers,
      icon: Wallet,
      tone: kpis.payrollBlockers > 0 ? ("rose" as const) : ("emerald" as const),
    },
    {
      label: t("kpiDriverExceptions"),
      value: kpis.driverExceptions,
      icon: AlertTriangle,
      tone: kpis.driverExceptions > 0 ? ("amber" as const) : ("emerald" as const),
    },
    {
      label: t("kpiAbsentToday"),
      value: kpis.absentToday,
      icon: UserMinus,
      tone: kpis.absentToday > 0 ? ("rose" as const) : ("emerald" as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <MetricTile
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
        />
      ))}
    </div>
  );
}
