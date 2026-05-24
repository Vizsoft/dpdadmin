"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleChip } from "@/components/app/toggle-chip";
import { DriverLocationsMap } from "@/features/locations/driver-locations-map";
import { fetchDriversForAdmin } from "@/features/drivers/drivers-actions";
import { queryKeys } from "@/lib/query/query-keys";
import type { DriverLocationEvent } from "@/features/locations/types";
import { HistoryPlaybackControls } from "./history-playback-controls";
import { useLiveHistory } from "./use-live-history";
import { TrackingTabSwitcher, type TrackingViewTab } from "./tracking-tab-switcher";
import { TrackingCommandLayout, TrackingGlassCard, TrackingMapFrame } from "./tracking-shell";
import { HistorySummaryKpis, computeHistorySummary } from "./history-summary-kpis";
import { HistoryDatePicker } from "./history-date-picker";
import { useDriverHistoryActiveDates } from "./use-driver-history-dates";
import {
  HistoryLoadingSkeleton,
  NoDataForDateEmpty,
  SelectDriverEmpty,
} from "./history-empty-states";
import { HistoryDriverHeader } from "./history-driver-header";
import { HistoryRecentStops } from "./history-recent-stops";
import { HistoryEventsTable } from "./history-events-table";

const KUWAIT_TZ = "Asia/Kuwait";

function kuwaitToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KUWAIT_TZ }).format(new Date());
}

function subsamplePath<T>(points: T[], max = 500): T[] {
  if (points.length <= max) return points;
  const step = Math.ceil(points.length / max);
  return points.filter((_, i) => i % step === 0 || i === points.length - 1);
}

function formatTime(iso: string, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale ?? "en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: KUWAIT_TZ,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function kuwaitDateShift(daysBack: number): string {
  const now = new Date();
  const shifted = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: KUWAIT_TZ }).format(shifted);
}

function formatDateLabel(date: string, locale?: string): string {
  const parsed = new Date(`${date}T00:00:00+03:00`);
  return new Intl.DateTimeFormat(locale ?? "en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: KUWAIT_TZ,
  }).format(parsed);
}

export function LiveTrackingHistoryView({
  activeTab,
  onTabChange,
}: {
  activeTab: TrackingViewTab;
  onTabChange: (tab: TrackingViewTab) => void;
}) {
  const t = useTranslations("pages.liveTracking");
  const locale = useLocale();
  const [driverId, setDriverId] = useState<string>("");
  const [date, setDate] = useState(kuwaitToday());
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastTickRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  const { data: driversMeta = [] } = useQuery({
    queryKey: queryKeys.drivers.list({ archived: false }),
    queryFn: () => fetchDriversForAdmin({ archived: false }),
  });

  const linkedDrivers = useMemo(
    () =>
      driversMeta
        .filter((d) => d.linked_profile_id)
        .map((d) => ({
          profileId: d.linked_profile_id as string,
          label: `${d.full_name} (#${d.driver_code})`,
        })),
    [driversMeta],
  );

  const { data: events = [], isLoading } = useLiveHistory(driverId || null, date);

  const yearMonth = date.slice(0, 7);
  const [calendarMonth, setCalendarMonth] = useState(yearMonth);
  useEffect(() => {
    setCalendarMonth(date.slice(0, 7));
  }, [date]);
  const { data: activeDateList = [] } = useDriverHistoryActiveDates(driverId || null, calendarMonth);
  const activeDates = useMemo(() => new Set(activeDateList), [activeDateList]);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    [events],
  );

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [driverId, date, sortedEvents.length]);

  const path = useMemo(
    () =>
      subsamplePath(
        sortedEvents.map((e) => ({ lat: e.latitude, lng: e.longitude })),
      ),
    [sortedEvents],
  );

  const currentEvent: DriverLocationEvent | null = sortedEvents[index] ?? null;
  const summary = useMemo(() => computeHistorySummary(sortedEvents), [sortedEvents]);

  const markers = useMemo(() => {
    const list: Array<{
      id: string;
      lat: number;
      lng: number;
      title?: string;
      highlight?: boolean;
      pinStatus?: "active" | "idle" | "alert";
      trackingStatus?: DriverLocationEvent["trackingStatus"];
    }> = [];

    for (const e of sortedEvents) {
      if (e.trackingStatus === "delivery_submit") {
        list.push({
          id: `delivery-${e.id}`,
          lat: e.latitude,
          lng: e.longitude,
          title: t("deliverySubmitMarker"),
          highlight: true,
        });
      }
    }

    if (currentEvent) {
      list.push({
        id: "playback-head",
        lat: currentEvent.latitude,
        lng: currentEvent.longitude,
        title: formatTime(currentEvent.recordedAt, locale),
        pinStatus: "active",
        trackingStatus: currentEvent.trackingStatus,
        highlight: true,
      });
    }

    return list;
  }, [sortedEvents, currentEvent, t, locale]);

  const deliverySubmitIndices = useMemo(
    () =>
      sortedEvents.reduce<number[]>((acc, event, idx) => {
        if (event.trackingStatus === "delivery_submit") acc.push(idx);
        return acc;
      }, []),
    [sortedEvents],
  );

  const durationLabel = useMemo(() => {
    if (sortedEvents.length < 2) return "—";
    const start = new Date(sortedEvents[0]!.recordedAt).getTime();
    const end = new Date(sortedEvents[sortedEvents.length - 1]!.recordedAt).getTime();
    const mins = Math.round((end - start) / 60000);
    return `${mins} min`;
  }, [sortedEvents]);

  useEffect(() => {
    if (!playing || sortedEvents.length < 2) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const stepMs = 500 / speed;

    const tick = (now: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      if (elapsed >= stepMs) {
        lastTickRef.current = now;
        setIndex((prev) => {
          if (prev >= sortedEvents.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = 0;
    };
  }, [playing, speed, sortedEvents.length]);

  const selectedDriverMeta = useMemo(
    () => driversMeta.find((row) => row.linked_profile_id === driverId) ?? null,
    [driverId, driversMeta],
  );

  const quickRange = useMemo(() => {
    if (date === kuwaitToday()) return "today";
    if (date === kuwaitDateShift(1)) return "yesterday";
    if (date === kuwaitDateShift(7)) return "last7";
    return "custom";
  }, [date]);

  return (
    <div className="space-y-2">
      <TrackingCommandLayout
        left={
          <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-700/80">
              <TrackingTabSwitcher value={activeTab} onChange={onTabChange} className="mb-2" />
              <HistorySummaryKpis summary={summary} loading={isLoading} />
            </div>

            <div className="space-y-2 border-b border-slate-200 px-3 py-3 dark:border-slate-700/80">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("historyDriver")}</Label>
                <Select value={driverId || undefined} onValueChange={(id) => setDriverId(id ?? "")}>
                  <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg">
                    <SelectValue placeholder={t("selectDriver")} />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedDrivers.map((d) => (
                      <SelectItem key={d.profileId} value={d.profileId} label={d.label}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("historyDate")}</Label>
                <HistoryDatePicker
                  value={date}
                  onChange={setDate}
                  activeDates={activeDates}
                  disabled={!driverId}
                  locale={locale}
                  onViewMonthChange={setCalendarMonth}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ToggleChip selected={quickRange === "today"} onClick={() => setDate(kuwaitToday())}>
                  {t("historyToday")}
                </ToggleChip>
                <ToggleChip selected={quickRange === "yesterday"} onClick={() => setDate(kuwaitDateShift(1))}>
                  {t("historyYesterday")}
                </ToggleChip>
                <ToggleChip selected={quickRange === "last7"} onClick={() => setDate(kuwaitDateShift(7))}>
                  {t("historyLast7Days")}
                </ToggleChip>
              </div>
            </div>

            {driverId && sortedEvents.length > 0 ? (
              <div className="flex-1 overflow-auto px-3 py-3">
                <HistoryRecentStops
                  events={sortedEvents}
                  selectedIndex={index}
                  onSelectIndex={(nextIndex) => {
                    setPlaying(false);
                    setIndex(nextIndex);
                  }}
                  formatTime={(iso) => formatTime(iso, locale)}
                />
              </div>
            ) : null}
          </TrackingGlassCard>
        }
        center={
          <TrackingMapFrame mapHeightClass="h-[min(58vh,560px)] min-h-[360px]">
            {!driverId ? (
              <SelectDriverEmpty />
            ) : isLoading ? (
              <div className="h-full w-full bg-muted/40 p-4">
                <HistoryLoadingSkeleton />
              </div>
            ) : sortedEvents.length === 0 ? (
              <NoDataForDateEmpty
                dateLabel={formatDateLabel(date, locale)}
                onPickYesterday={() => setDate(kuwaitDateShift(1))}
                onPickLast7Days={() => setDate(kuwaitDateShift(7))}
              />
            ) : (
              <>
                <DriverLocationsMap
                  markers={markers}
                  path={path}
                  mapHeightClass="h-full min-h-[360px]"
                  fitToMarkers={path.length > 0}
                  className="h-full rounded-none border-0"
                  frameless
                />
                {selectedDriverMeta ? (
                  <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[280px]">
                    <div className="pointer-events-auto">
                      <HistoryDriverHeader
                        name={selectedDriverMeta.full_name}
                        code={selectedDriverMeta.driver_code}
                        zoneName={selectedDriverMeta.zone_name}
                        isOnDuty={selectedDriverMeta.is_on_duty}
                        dateLabel={formatDateLabel(date, locale)}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="pointer-events-none absolute right-3 top-3 z-20">
                  <div className="pointer-events-auto">
                    <HistoryPlaybackControls
                      playing={playing}
                      onTogglePlay={() => {
                        lastTickRef.current = 0;
                        setPlaying((prev) => !prev);
                      }}
                      onRestart={() => {
                        setPlaying(false);
                        setIndex(0);
                      }}
                      speed={speed}
                      onSpeedChange={(value) => {
                        setSpeed(value);
                        lastTickRef.current = 0;
                      }}
                      index={index}
                      maxIndex={sortedEvents.length - 1}
                      onIndexChange={(nextIndex) => {
                        setPlaying(false);
                        setIndex(nextIndex);
                      }}
                      currentLabel={currentEvent ? formatTime(currentEvent.recordedAt, locale) : "—"}
                      durationLabel={durationLabel}
                      deliverySubmitIndices={deliverySubmitIndices}
                    />
                  </div>
                </div>
              </>
            )}
          </TrackingMapFrame>
        }
      />

      {driverId && !isLoading && sortedEvents.length > 0 ? (
        <HistoryEventsTable
          events={sortedEvents}
          currentIndex={index}
          onSelectIndex={(nextIndex) => {
            setPlaying(false);
            setIndex(nextIndex);
          }}
          formatTime={(iso) => formatTime(iso, locale)}
        />
      ) : null}
    </div>
  );
}
