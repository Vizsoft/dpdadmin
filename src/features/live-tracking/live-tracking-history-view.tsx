"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { cn } from "@/lib/utils";
import { DriverLocationsMap } from "@/features/locations/driver-locations-map";
import {
  formatBatteryPct,
  formatSpeedMps,
} from "@/features/locations/location-status";
import { fetchDriversForAdmin } from "@/features/drivers/drivers-actions";
import { queryKeys } from "@/lib/query/query-keys";
import type { DriverLocationEvent } from "@/features/locations/types";
import { HistoryPlaybackControls } from "./history-playback-controls";
import { useLiveHistory } from "./use-live-history";

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

export function LiveTrackingHistoryView() {
  const t = useTranslations("pages.liveTracking");
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
        title: formatTime(currentEvent.recordedAt),
        pinStatus: "active",
        trackingStatus: currentEvent.trackingStatus,
      });
    }

    return list;
  }, [sortedEvents, currentEvent, t]);

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

  const trackingStatusLabel = (status: DriverLocationEvent["trackingStatus"]) => {
    if (status === "moving") return t("statusMoving");
    if (status === "delivery_submit") return t("statusDeliverySubmit");
    return t("statusIdle");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("historyDriver")}</Label>
          <Select
            value={driverId || undefined}
            onValueChange={(id) => setDriverId(id ?? "")}
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg">
              <SelectValue placeholder={t("selectDriver")} />
            </SelectTrigger>
            <SelectContent>
              {linkedDrivers.map((d) => (
                <SelectItem key={d.profileId} value={d.profileId}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="history-date" className="text-xs text-muted-foreground">
            {t("historyDate")}
          </Label>
          <Input
            id="history-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 cursor-pointer rounded-lg"
          />
        </div>
      </div>

      {!driverId ? (
        <p className="text-center text-sm text-muted-foreground">{t("selectDriver")}</p>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedEvents.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t("noHistory")}</p>
      ) : (
        <>
          <HistoryPlaybackControls
            playing={playing}
            onTogglePlay={() => {
              lastTickRef.current = 0;
              setPlaying((p) => !p);
            }}
            speed={speed}
            onSpeedChange={(v) => {
              setSpeed(v);
              lastTickRef.current = 0;
            }}
            index={index}
            maxIndex={sortedEvents.length - 1}
            onIndexChange={(i) => {
              setPlaying(false);
              setIndex(i);
            }}
            currentLabel={
              currentEvent ? formatTime(currentEvent.recordedAt) : "—"
            }
            durationLabel={durationLabel}
          />

          <DriverLocationsMap
            markers={markers}
            path={path}
            mapHeightClass="h-[min(50vh,480px)] min-h-[320px]"
            fitToMarkers={path.length > 0}
            className="rounded-xl"
          />

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colTime")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colTrackingStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colZoneStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colSpeed")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colBattery")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colAccuracy")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDelivery")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEvents.map((e, i) => (
                  <TableRow
                    key={e.id}
                    className={cn(
                      "cursor-pointer",
                      i === index ? "bg-muted/50" : undefined,
                    )}
                    onClick={() => {
                      setPlaying(false);
                      setIndex(i);
                    }}
                  >
                    <TableCell className="font-mono text-xs">
                      {formatTime(e.recordedAt)}
                    </TableCell>
                    <TableCell className="text-xs">{trackingStatusLabel(e.trackingStatus)}</TableCell>
                    <TableCell className="text-xs">
                      {e.zoneStatus ? t(`zoneStatus.${e.zoneStatus}`) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{formatSpeedMps(e.speedMps)}</TableCell>
                    <TableCell className="text-xs">{formatBatteryPct(e.batteryPct)}</TableCell>
                    <TableCell className="text-xs">
                      {e.accuracyMeters != null ? `±${e.accuracyMeters.toFixed(0)} m` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {e.deliveryId ? (
                        <Link
                          href={`/deliveries?highlight=${e.deliveryId}`}
                          className="text-primary hover:underline"
                        >
                          {t("viewDelivery")}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
