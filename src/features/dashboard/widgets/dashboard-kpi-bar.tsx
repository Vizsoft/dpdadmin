"use client";

import { useTranslations } from "next-intl";
import {
  Activity,
  CheckCircle2,
  ClipboardCheck,
  ClipboardX,
  MapPin,
  Package,
  Store,
  UserMinus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KpiCard, type KpiAccent } from "@/components/dashboard/kpi-card";
import type { DashboardKpis } from "../types";

type KpiItem = {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: KpiAccent;
};

export function DashboardKpiBar({ kpis }: { kpis: DashboardKpis }) {
  const t = useTranslations("pages.dashboard");

  const items: KpiItem[] = [
    { label: t("kpiTotalDrivers"), value: kpis.totalDrivers, icon: Users, accent: "primary" },
    { label: t("kpiOnlineNow"), value: kpis.onlineNow, icon: Activity, accent: "success" },
    { label: t("kpiOnShift"), value: kpis.onShift, icon: CheckCircle2, accent: "success" },
    { label: t("kpiTrackedNow"), value: kpis.trackedNow, icon: MapPin, accent: "primary" },
    { label: t("kpiCheckedIn"), value: kpis.checkedInToday, icon: ClipboardCheck, accent: "success" },
    { label: t("kpiNotReported"), value: kpis.notReportedYet, icon: ClipboardX, accent: "warning" },
    { label: t("kpiRestaurantAssigned"), value: kpis.restaurantAssigned, icon: Store, accent: "default" },
    { label: t("kpiSuspended"), value: kpis.suspendedArchived, icon: UserMinus, accent: "danger" },
    { label: t("kpiDeliveriesToday"), value: kpis.deliveriesToday, icon: Package, accent: "primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((kpi) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          icon={kpi.icon}
          accent={kpi.accent}
        />
      ))}
    </div>
  );
}
