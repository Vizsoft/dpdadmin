"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Package, ShieldAlert, XCircle } from "lucide-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { MetricTile } from "@/components/ui/metric-tile";
import type { DeliveryFeedItem, DeliveryMonitorMetrics } from "../types";
import { DashboardWidget } from "./dashboard-widget";

function feedVariant(severity: DeliveryFeedItem["severity"]) {
  if (severity === "success") return "success" as const;
  if (severity === "warning") return "warning" as const;
  if (severity === "danger") return "danger" as const;
  return "neutral" as const;
}

export function DeliveryMonitorWidget({
  metrics,
  feed,
  locale,
}: {
  metrics: DeliveryMonitorMetrics;
  feed: DeliveryFeedItem[];
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget title={t("widgetDeliveryMonitor")} href={`/${locale}/deliveries`}>
      <div className="grid grid-cols-2 gap-2 border-b border-border p-4 sm:grid-cols-4">
        <MetricTile
          label={t("metricSubmitted")}
          value={metrics.submittedToday}
          icon={Package}
          tone="primary"
          className="p-2.5"
        />
        <MetricTile
          label={t("metricPending")}
          value={metrics.pending}
          icon={Clock}
          tone={metrics.pending > 0 ? "warning" : "neutral"}
          className="p-2.5"
        />
        <MetricTile
          label={t("metricVerified")}
          value={metrics.verified}
          icon={CheckCircle2}
          tone="success"
          className="p-2.5"
        />
        <MetricTile
          label={t("metricRejected")}
          value={metrics.rejected}
          icon={XCircle}
          tone={metrics.rejected > 0 ? "danger" : "neutral"}
          className="p-2.5"
        />
      </div>
      {metrics.underReview > 0 ? (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
          <ShieldAlert className="size-3.5 text-warning" />
          <span className="font-medium">{metrics.underReview}</span>
          <span className="text-muted-foreground">{t("metricUnderReview")}</span>
        </div>
      ) : null}
      <ul className="divide-y divide-border">
        {feed.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</li>
        ) : (
          feed.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.driverName}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`deliveryFeed.${item.messageKey}`, { detail: item.detail })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill variant={feedVariant(item.severity)}>
                  {t(`deliveryFeedLabel.${item.messageKey}`)}
                </StatusPill>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(item.at).toLocaleTimeString()}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </DashboardWidget>
  );
}
