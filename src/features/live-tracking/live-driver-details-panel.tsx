"use client";

import { useTranslations } from "next-intl";
import { Package, Phone, Truck } from "lucide-react";
import { Pill, SignalBars, StatusDot } from "@/components/ui/metric-tile";
import type { DriverLiveLocation } from "@/features/locations/types";
import {
  formatBatteryLevel,
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

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700/80">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("driverDetails")}
          </h3>
          <button type="button" className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            ^
          </button>
        </div>

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
            <p className="text-xs text-slate-500 dark:text-slate-300">Tata Ace EV</p>
          </div>
          <div className="flex items-center gap-1.5">
            <IconButton icon={Truck} />
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
              <p className="text-[11px] text-slate-500 dark:text-slate-300">{t("shiftTime")}</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                06:45:21
              </p>
            </div>
            <div className="text-end">
              <p className="text-[11px] text-slate-500 dark:text-slate-300">{t("gpsQuality")}</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {t(`gpsQualityLevel.${gpsQuality}`)}
              </p>
              <SignalBars value={gpsQuality === "excellent" ? 4 : gpsQuality === "good" ? 3 : gpsQuality === "weak" ? 2 : 1} className="ms-auto mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto p-4">
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t("liveMetrics")}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric label={t("currentSpeed")} value={formatSpeedKmh(driver.speedMps)} />
            <MiniMetric label={t("metricDistanceToday")} value="120 km" />
            <MiniMetric label={t("metricOrdersCompleted")} value="12" />
            <MiniMetric label={t("ordersPending")} value="2" />
            <MiniMetric label={t("idleTime")} value="00:15" />
            <MiniMetric label={t("colBattery")} value={formatBatteryLevel(driver.batteryPct)} />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
            <span>{t("signalStrong")}</span>
            <SignalBars value={4} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("activeOrders")} (2)
            </h4>
            <button type="button" className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("viewAll")}
            </button>
          </div>
          <div className="space-y-2">
            <OrderRow
              id="#ORD12548"
              priority={t("priorityHigh")}
              customer="Ankit Verma"
              route="DLF Phase 3, Gurugram"
              eta="20 min"
              priorityTone="rose"
            />
            <OrderRow
              id="#ORD12549"
              priority={t("priorityMedium")}
              customer="Neha Singh"
              route="Sector 56, Gurugram"
              eta="45 min"
              priorityTone="amber"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t("activityTimeline")}
            </h4>
            <button type="button" className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("viewAll")}
            </button>
          </div>
          <ol className="space-y-2">
            <TimelineItem time="10:20 AM" text={t("timelineStart")} tone="emerald" />
            <TimelineItem time="10:28 AM" text={t("timelineAccepted")} tone="blue" />
            <TimelineItem time="10:45 AM" text={t("timelineGeofence")} tone="indigo" />
            <TimelineItem time="11:05 AM" text={t("timelineOverspeed")} tone="rose" />
            <TimelineItem time="11:18 AM" text={t("timelineDelivered")} tone="emerald" />
            <TimelineItem time="11:25 AM" text={t("timelineGps")} tone="amber" />
          </ol>
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

function OrderRow({
  id,
  priority,
  customer,
  route,
  eta,
  priorityTone,
}: {
  id: string;
  priority: string;
  customer: string;
  route: string;
  eta: string;
  priorityTone: "rose" | "amber";
}) {
  return (
    <div className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{id}</span>
          <Pill tone={priorityTone}>{priority}</Pill>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400">{eta}</span>
      </div>
      <p className="mt-1 text-slate-500 dark:text-slate-300">{customer}</p>
      <p className="text-slate-500 dark:text-slate-300">{route}</p>
    </div>
  );
}

function TimelineItem({
  time,
  text,
  tone,
}: {
  time: string;
  text: string;
  tone: "emerald" | "blue" | "indigo" | "rose" | "amber";
}) {
  return (
    <li className="grid grid-cols-[62px_minmax(0,1fr)] items-start gap-2 text-xs">
      <span className="text-slate-500 dark:text-slate-300">{time}</span>
      <span className="inline-flex items-start gap-2">
        <span className="relative mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <StatusDot tone={tone} />
        </span>
        <span className="text-slate-700 dark:text-slate-200">{text}</span>
      </span>
    </li>
  );
}
