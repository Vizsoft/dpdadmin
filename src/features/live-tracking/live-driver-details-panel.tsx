"use client";

import { useTranslations } from "next-intl";
import { Package, Phone } from "lucide-react";
import { Pill, SignalBars, StatusDot } from "@/components/ui/metric-tile";
import type { DriverLiveLocation } from "@/features/locations/types";
import {
  formatAccuracyMeters,
  formatBatteryLevel,
  formatDurationSince,
  formatSpeedKmh,
  driverInitials,
  gpsQualityFromAccuracy,
} from "./tracking-metrics";
import { TrackingGlassCard } from "./tracking-shell";
import type { LiveDriverMeta } from "./live-tracking-types";

export function LiveDriverDetailsPanel({
  driver,
  meta,
}: {
  driver: DriverLiveLocation | null;
  meta?: LiveDriverMeta;
}) {
  const t = useTranslations("pages.liveTracking");

  if (!driver) {
    return (
      <TrackingGlassCard className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 rounded-full border border-slate-200 bg-slate-100 p-2.5 dark:border-slate-700 dark:bg-slate-800">
          <Package className="h-7 w-7 text-slate-400 dark:text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {t("selectDriverTitle")}
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-slate-500 dark:text-slate-300">
          {t("selectDriverHint")}
        </p>
      </TrackingGlassCard>
    );
  }

  const gpsQuality = gpsQualityFromAccuracy(driver.accuracyMeters);
  const signalBars =
    gpsQuality === "excellent" ? 4 : gpsQuality === "good" ? 3 : gpsQuality === "weak" ? 2 : 1;

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700/80">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-base font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
              {driverInitials(driver.driverName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {driver.driverName}
                </p>
                <Pill tone={driver.isOnDuty ? "emerald" : "slate"} variant="solid">
                  {driver.isOnDuty ? t("onDuty") : t("offDuty")}
                </Pill>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                {driver.driverCode}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">{meta?.zoneName ?? "—"}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {meta?.phone ? (
                <a href={`tel:${meta.phone}`}>
                  <IconButton icon={Phone} />
                </a>
              ) : (
                <IconButton icon={Phone} />
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-900">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300">{t("colLastSeen")}</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {formatDurationSince(driver.lastSeenAt)}
              </p>
            </div>
            <div className="text-end">
              <p className="text-[11px] text-slate-500 dark:text-slate-300">{t("gpsQuality")}</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {t(`gpsQualityLevel.${gpsQuality}`)}
              </p>
              <SignalBars value={signalBars} className="ms-auto mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto p-4">
        <section>
          <div className="grid grid-cols-2 gap-2">
            <MiniMetric label={t("currentSpeed")} value={formatSpeedKmh(driver.speedMps)} />
            <MiniMetric label={t("colBattery")} value={formatBatteryLevel(driver.batteryPct)} />
            <MiniMetric label={t("gpsQuality")} value={t(`gpsQualityLevel.${gpsQuality}`)} />
            <MiniMetric label={t("colAccuracy")} value={formatAccuracyMeters(driver.accuracyMeters)} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
            <StatusDot
              tone={
                driver.pinStatus === "alert"
                  ? "rose"
                  : driver.pinStatus === "active"
                    ? "emerald"
                    : "amber"
              }
            />
            <span>{t("liveMetrics")}</span>
            <SignalBars value={signalBars} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("activeOrders")}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">No active orders</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("activityTimeline")}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            {t("colLastSeen")}: {formatDurationSince(driver.lastSeenAt)}
          </p>
        </section>
      </div>
    </TrackingGlassCard>
  );
}

function IconButton({ icon: Icon }: { icon: typeof Phone }) {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}
