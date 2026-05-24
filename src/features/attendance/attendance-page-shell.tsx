"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  Edit3,
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { TabBar } from "@/components/dashboard/tab-bar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { AttendancePill } from "@/features/drivers/driver-list-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/contexts/auth-context";
import { selectOptions } from "@/lib/select-items";
import { exportAttendanceCsv } from "./attendance-actions";
import { AttendanceCorrectionSheet } from "./attendance-correction-sheet";
import { useAttendanceList } from "./use-attendance";
import type { AttendanceListRow, AttendanceStatus, AttendanceTabFilter } from "./types";

function kuwaitToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function attendanceStatusVariant(
  status: AttendanceStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "present":
      return "success";
    case "late":
      return "warning";
    case "on_leave":
      return "neutral";
    case "absent":
    default:
      return "danger";
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuwait",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDistanceMeters(distanceMeters: number | null): string {
  if (distanceMeters == null || Number.isNaN(distanceMeters)) return "—";
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function AttendancePageContent() {
  const t = useTranslations("pages.attendance");
  const locale = useLocale();
  const auth = useAuth();
  const canManage = auth.can("attendance.manage");

  const today = kuwaitToday();
  const [tabFilter, setTabFilter] = useState<AttendanceTabFilter>("live");
  const [fromDate, setFromDate] = useState(addDays(today, -6));
  const [toDate, setToDate] = useState(today);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AttendanceListRow | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, refetch } = useAttendanceList({
    tab: tabFilter,
    fromDate: tabFilter === "logs" ? fromDate : undefined,
    toDate: tabFilter === "logs" ? toDate : undefined,
  });

  const rows = data?.rows ?? [];
  const kpis = data?.kpis;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.driver_name.toLowerCase().includes(q) ||
        r.driver_code.toLowerCase().includes(q) ||
        r.driver_phone.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const statusFilterItems = useMemo(
    () =>
      selectOptions([
        { value: "all", label: t("filterStatusAll") },
        { value: "present", label: t("status.present") },
        { value: "late", label: t("status.late") },
        { value: "absent", label: t("status.absent") },
        { value: "on_leave", label: t("status.on_leave") },
      ]),
    [t],
  );

  const kpiItems = useMemo(() => {
    if (tabFilter === "logs" || !kpis) {
      return [
        { label: t("kpiPresent"), value: "—" },
        { label: t("kpiLate"), value: "—" },
        { label: t("kpiAbsent"), value: "—" },
        { label: t("kpiOnLeave"), value: "—" },
        { label: t("kpiActiveNow"), value: "—" },
      ];
    }
    return [
      { label: t("kpiPresent"), value: kpis.present },
      { label: t("kpiLate"), value: kpis.late },
      { label: t("kpiAbsent"), value: kpis.absent },
      { label: t("kpiOnLeave"), value: kpis.on_leave },
      { label: t("kpiActiveNow"), value: kpis.active_now },
    ];
  }, [kpis, tabFilter, t]);

  const tabItems = [
    { id: "live" as const, label: t("tabLive") },
    { id: "logs" as const, label: t("tabLogs") },
    { id: "exceptions" as const, label: t("tabExceptions") },
  ];

  const emptyTitle =
    tabFilter === "live"
      ? t("emptyLive")
      : tabFilter === "exceptions"
        ? t("emptyExceptions")
        : t("emptyTitle");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    const csv = await exportAttendanceCsv(visible);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openCorrection = (row: AttendanceListRow, create = false) => {
    setSelectedRow(row);
    setCreateMode(create);
    setSheetOpen(true);
  };

  const showEmptyAll = !isLoading && rows.length === 0;
  const showEmptySearch = !isLoading && rows.length > 0 && visible.length === 0;

  return (
    <AppPage>
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 cursor-pointer rounded-lg"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`me-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {t("refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 cursor-pointer rounded-lg"
              onClick={() => void handleExport()}
              disabled={visible.length === 0}
            >
              <Download className="me-2 h-3.5 w-3.5" />
              {t("export")}
            </Button>
          </>
        }
      />

      <KpiGrid items={kpiItems} />

      <AppListCard
        toolbar={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <TabBar
                items={tabItems}
                activeId={tabFilter}
                onSelect={(id) => setTabFilter(id as AttendanceTabFilter)}
              />
              <div className="relative w-full xl:max-w-xs">
                <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-9 ps-8"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tabFilter === "logs" ? (
                <>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 w-auto"
                    aria-label={t("fromDate")}
                  />
                  <span className="text-sm text-muted-foreground">{t("to")}</span>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 w-auto"
                    aria-label={t("toDate")}
                  />
                </>
              ) : null}
              <Select
                items={statusFilterItems}
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value ?? "all")}
              >
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder={t("filterStatusAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label={t("filterStatusAll")}>
                    {t("filterStatusAll")}
                  </SelectItem>
                  <SelectItem value="present" label={t("status.present")}>
                    {t("status.present")}
                  </SelectItem>
                  <SelectItem value="late" label={t("status.late")}>
                    {t("status.late")}
                  </SelectItem>
                  <SelectItem value="absent" label={t("status.absent")}>
                    {t("status.absent")}
                  </SelectItem>
                  <SelectItem value="on_leave" label={t("status.on_leave")}>
                    {t("status.on_leave")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : showEmptyAll || showEmptySearch ? (
          <AppEmptyState title={emptyTitle} />
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDriver")}</TableHead>
                  {tabFilter === "logs" ? (
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colDate")}</TableHead>
                  ) : null}
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colCheckIn")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colCheckOut")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDistance")}</TableHead>
                  <TableHead className={`${TABLE_HEAD_CLASS} hidden sm:table-cell`}>
                    {t("colOnDuty")}
                  </TableHead>
                  <TableHead className={`${TABLE_HEAD_CLASS} text-end`}>
                    {t("colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={`${row.driver_id}-${row.log_date}-${row.id ?? "new"}`}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.driver_name}</p>
                        <p className="text-xs text-muted-foreground">#{row.driver_code}</p>
                      </div>
                    </TableCell>
                    {tabFilter === "logs" ? (
                      <TableCell className="text-sm tabular-nums">{row.log_date}</TableCell>
                    ) : null}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(row.check_in_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(row.check_out_at)}
                    </TableCell>
                    <TableCell>
                      <StatusPill variant={attendanceStatusVariant(row.status)} dot>
                        {t(`status.${row.status}`)}
                      </StatusPill>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceMeters(row.distance_meters)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <AttendancePill
                        onDuty={row.is_on_duty}
                        onDutyLabel={t("onDuty")}
                        offDutyLabel={t("offDuty")}
                      />
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={t("rowActions")}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canManage && (row.id || tabFilter === "live") ? (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                openCorrection(row, !row.id || row.status === "absent")
                              }
                            >
                              {row.id ? (
                                <>
                                  <Edit3 className="me-2 h-3.5 w-3.5" />
                                  {t("correct")}
                                </>
                              ) : (
                                <>
                                  <Plus className="me-2 h-3.5 w-3.5" />
                                  {t("markAttendance")}
                                </>
                              )}
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className="cursor-pointer"
                            render={
                              <Link href={`/${locale}/drivers/${row.driver_id}`} />
                            }
                          >
                            <ExternalLink className="me-2 h-3.5 w-3.5" />
                            {t("viewDriver")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AppListCard>

      <AttendanceCorrectionSheet
        row={selectedRow}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        createMode={createMode}
      />
    </AppPage>
  );
}

export function AttendancePageShell() {
  return <AttendancePageContent />;
}
