"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { TrackingGlassCard } from "@/features/live-tracking/tracking-shell";
import {
  fetchDriverAttendanceMonth,
  fetchDriverTodayTrackingSummary,
} from "@/features/driver-tracking/tracking-read-actions";
import { formatDurationSeconds, kuwaitToday } from "@/features/driver-tracking/kuwait-time";
export function DriverAttendanceTab({ driverId }: { driverId: string }) {
  const t = useTranslations("pages.drivers");
  const today = kuwaitToday();
  const month = useMemo(() => {
    const [y, m] = today.split("-").map(Number);
    return { year: y, month: m };
  }, [today]);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["drivers", "attendance-summary", driverId, today],
    queryFn: () => fetchDriverTodayTrackingSummary(driverId),
    enabled: Boolean(driverId),
  });

  const { data: monthRows = [], isLoading: monthLoading } = useQuery({
    queryKey: ["drivers", "attendance-month", driverId, month.year, month.month],
    queryFn: () => fetchDriverAttendanceMonth(driverId, month.year, month.month),
    enabled: Boolean(driverId),
  });

  if (summaryLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const wt = summary?.worktime;
  const shift = summary?.shift;

  return (
    <div className="space-y-3">
      <TrackingGlassCard className="border-slate-200 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold">{t("attendanceTodayTitle")}</p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t("attendanceCheckIn")}</dt>
            <dd>{wt?.check_in_at ? new Date(wt.check_in_at).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("attendanceCheckOut")}</dt>
            <dd>{wt?.check_out_at ? new Date(wt.check_out_at).toLocaleString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("attendanceLogDuration")}</dt>
            <dd>
              {wt?.log_duration_seconds != null
                ? formatDurationSeconds(wt.log_duration_seconds)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("attendanceOnline")}</dt>
            <dd>{wt ? formatDurationSeconds(wt.online_seconds) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("attendanceValidation")}</dt>
            <dd>
              {wt?.attendance_status ? (
                <StatusPill
                  variant={
                    wt.attendance_status === "present"
                      ? "success"
                      : wt.attendance_status === "online_unvalidated"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {wt.attendance_status}
                </StatusPill>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("attendanceShift")}</dt>
            <dd>
              {shift
                ? `${shift.shift_type} · ${shift.session1_label}${shift.session2_label ? ` / ${shift.session2_label}` : ""}`
                : "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/worktime?from=${today}&to=${today}`} />}
          >
            {t("attendanceOpenWorktime")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/driver-shifts?from=${today}&to=${today}`} />}
          >
            {t("attendanceOpenShifts")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/live-tracking?driverId=${driverId}`} />}
          >
            {t("attendanceOpenMap")}
          </Button>
        </div>
      </TrackingGlassCard>

      <TrackingGlassCard className="border-slate-200 bg-white p-4 dark:border-slate-700/80 dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold">{t("attendanceMonthTitle")}</p>
        {monthLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : monthRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("attendanceMonthEmpty")}</p>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:grid-cols-10">
            {monthRows.map((row) => (
              <div
                key={row.attendance_date}
                title={`${row.attendance_date}: ${row.status}`}
                className={`rounded px-1 py-2 text-center text-[10px] ${
                  row.status === "present"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40"
                    : row.status === "online_unvalidated"
                      ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {row.attendance_date.slice(-2)}
              </div>
            ))}
          </div>
        )}
      </TrackingGlassCard>
    </div>
  );
}
