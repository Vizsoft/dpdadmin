"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import type { ActivityTimelineItem } from "../types";
import { DashboardWidget } from "./dashboard-widget";

export function ActivityTimelineWidget({ items }: { items: ActivityTimelineItem[] }) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget title={t("widgetActivity")} className="min-h-[220px] lg:col-span-2">
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(`activity.${item.messageKey}`)}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}
