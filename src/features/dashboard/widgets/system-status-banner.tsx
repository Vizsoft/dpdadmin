"use client";

import { AlertTriangle, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { SystemStatusSummary } from "../types";

export function SystemStatusBanner({
  status,
  locale,
}: {
  status: SystemStatusSummary;
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  if (!status.maintenanceMode) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <Wrench className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("maintenanceBannerTitle")}</p>
        <p className="text-xs opacity-90">{t("maintenanceBannerHint")}</p>
      </div>
      <Link
        href={`/${locale}/settings/maintenance`}
        className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-amber-100/80 dark:hover:bg-amber-500/20"
      >
        <AlertTriangle className="size-3.5" />
        {t("maintenanceBannerAction")}
      </Link>
    </div>
  );
}
