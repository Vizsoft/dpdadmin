"use client";

import { Clock, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Pill } from "@/components/ui/metric-tile";
import type { AccessRequestRow } from "../types";
import { DashboardWidget } from "./dashboard-widget";

function ageTone(bucket: AccessRequestRow["ageBucket"]) {
  if (bucket === "stale") return "rose" as const;
  if (bucket === "waiting") return "amber" as const;
  return "blue" as const;
}

export function AccessRequestsWidget({
  rows,
  locale,
}: {
  rows: AccessRequestRow[];
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget
      title={t("widgetAccessRequests")}
      href={`/${locale}/settings/access-requests`}
      className="min-h-[280px]"
    >
      <ul className="divide-y divide-border">
        {rows.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <UserPlus className="size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">{t("accessRequestsEmptyTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("accessRequestsEmptyHint")}</p>
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{row.fullName ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
              <Pill tone={ageTone(row.ageBucket)}>{t(`accessAge.${row.ageBucket}`)}</Pill>
            </li>
          ))
        )}
      </ul>
    </DashboardWidget>
  );
}
