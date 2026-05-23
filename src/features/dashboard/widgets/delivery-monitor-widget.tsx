"use client";

import { useTranslations } from "next-intl";
import { StatusPill } from "@/components/dashboard/status-pill";
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
      <div className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 sm:grid-cols-5">
        {[
          { label: t("metricSubmitted"), value: metrics.submittedToday },
          { label: t("metricPending"), value: metrics.pending },
          { label: t("metricVerified"), value: metrics.verified },
          { label: t("metricRejected"), value: metrics.rejected },
          {
            label: t("metricSpike"),
            value: metrics.spikeDetected ? t("yes") : t("no"),
          },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted/30 px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>
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
