"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Radar, Timer, UserCheck, AlertTriangle } from "lucide-react";
import { MetricTile } from "@/components/ui/metric-tile";
import { fetchFleetOpsCounts } from "@/features/driver-tracking/tracking-read-actions";
import { TrackingGlassCard } from "@/features/live-tracking/tracking-shell";

export function FleetOpsWidget() {
  const t = useTranslations("pages.dashboard.fleetOps");
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "fleet-ops"],
    queryFn: fetchFleetOpsCounts,
    refetchInterval: 60_000,
  });

  const counts = data ?? {
    on_duty: 0,
    online_sessions: 0,
    unvalidated_today: 0,
    out_of_zone: 0,
  };

  return (
    <TrackingGlassCard className="border-slate-200 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t("title")}</p>
        <Link href="/live-tracking" className="text-xs font-medium text-primary hover:underline">
          {t("openMap")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricTile
          label={t("onDuty")}
          value={isLoading ? "…" : String(counts.on_duty)}
          icon={UserCheck}
          tone="emerald"
        />
        <MetricTile
          label={t("online")}
          value={isLoading ? "…" : String(counts.online_sessions)}
          icon={Timer}
          tone="blue"
        />
        <MetricTile
          label={t("unvalidated")}
          value={isLoading ? "…" : String(counts.unvalidated_today)}
          icon={AlertTriangle}
          tone="amber"
        />
        <MetricTile
          label={t("outOfZone")}
          value={isLoading ? "…" : String(counts.out_of_zone)}
          icon={Radar}
          tone="rose"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Link href="/attendance" className="text-primary hover:underline">
          {t("linkAttendance")}
        </Link>
        <Link href="/worktime" className="text-primary hover:underline">
          {t("linkWorktime")}
        </Link>
        <Link href="/driver-shifts" className="text-primary hover:underline">
          {t("linkShifts")}
        </Link>
      </div>
    </TrackingGlassCard>
  );
}
