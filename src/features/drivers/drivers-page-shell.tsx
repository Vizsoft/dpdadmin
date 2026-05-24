"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { SearchSelect } from "@/components/ui/search-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { partnerSearchOptions, zoneSearchOptions } from "@/lib/search-options";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";
import { useDriverFormOptions } from "./use-driver-form-options";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { fetchDriverDetail } from "./drivers-actions";
import { useDriversList, type DriversTabFilter } from "./use-drivers";
import {
  DRIVERS_PAGE_SIZE,
  DRIVERS_SORT_KEYS,
  sortDrivers,
  type DriversSortKey,
} from "./drivers-list-utils";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  AccountStatusPill,
  AttendancePill,
  formatDriverCodeDisplay,
  formatPhoneInternational,
  PartnerCell,
  PasscodeCell,
} from "./driver-list-ui";
import { DriverFormSheet } from "./driver-form-sheet";
import { DriversKpiStrip } from "./drivers-kpi-strip";
import {
  DRIVER_ACCOUNT_STATUSES,
  type DriverAccountStatus,
  type DriverListRow,
} from "./types";

const SORT_I18N: Record<DriversSortKey, string> = {
  name_asc: "sortNameAsc",
  name_desc: "sortNameDesc",
  driver_code_asc: "sortDriverCodeAsc",
  driver_code_desc: "sortDriverCodeDesc",
  employee_id_asc: "sortEmployeeIdAsc",
  employee_id_desc: "sortEmployeeIdDesc",
  zone_asc: "sortZoneAsc",
  zone_desc: "sortZoneDesc",
  partner_asc: "sortPartnerAsc",
  partner_desc: "sortPartnerDesc",
  deliveries_desc: "sortDeliveriesDesc",
  deliveries_asc: "sortDeliveriesAsc",
  status_active_first: "sortStatusActiveFirst",
  on_duty_first: "sortOnDutyFirst",
};

function exportDriversCsv(rows: DriverListRow[]) {
  const header = [
    "id",
    "driver_code",
    "employee_id",
    "full_name",
    "phone",
    "partner",
    "zone",
    "account_status",
    "on_duty",
    "today_deliveries",
    "workflow_status",
    "linked",
    "app_passcode",
  ];
  const escape = (v: string | number | boolean) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.driver_code,
        r.employee_id ?? "",
        r.full_name,
        r.phone,
        r.partner_name,
        r.zone_name,
        r.account_status,
        r.is_on_duty ? "yes" : "no",
        r.today_deliveries,
        r.workflow_status,
        r.linked ? "yes" : "no",
        r.app_passcode ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `drivers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DriversPageSkeleton() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function DriversPageContent() {
  const t = useTranslations("pages.drivers");
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [tabFilter, setTabFilter] = useState<DriversTabFilter>("all");
  const listArchived = tabFilter === "archived";
  const { data: drivers = [], isLoading, refetch } = useDriversList(listArchived);
  const { data: formOptions } = useDriverFormOptions();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DriverAccountStatus>("all");
  const [sortKey, setSortKey] = useState<DriversSortKey>("name_asc");
  const [visibleCount, setVisibleCount] = useState(DRIVERS_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const loadMoreRef = useRef<HTMLTableRowElement | null>(null);

  const prefetchDriverDetail = (driverId: string) => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.drivers.detail(driverId),
      queryFn: () => fetchDriverDetail(driverId),
      staleTime: 60_000,
    });
  };

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
      router.replace("/drivers");
    }
  }, [searchParams, router]);

  useEffect(() => {
    setVisibleCount(DRIVERS_PAGE_SIZE);
  }, [tabFilter, search, zoneFilter, partnerFilter, statusFilter, sortKey, drivers.length]);

  const zoneSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterZoneAll"), keywords: [t("filterZoneAll")] },
      ...zoneSearchOptions(formOptions?.zones ?? []),
    ],
    [formOptions?.zones, t],
  );

  const partnerSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterPartnerAll"), keywords: [t("filterPartnerAll")] },
      ...partnerSearchOptions(formOptions?.partners ?? []),
    ],
    [formOptions?.partners, t],
  );

  const statusSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterStatusAll") },
      ...DRIVER_ACCOUNT_STATUSES.map((status) => ({
        value: status,
        label: accountStatusLabelFor(status),
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels from t()
    [t],
  );

  const sortSelectItems = useMemo(
    () =>
      DRIVERS_SORT_KEYS.map((key) => ({
        value: key,
        label: t(SORT_I18N[key]),
      })),
    [t],
  );

  function accountStatusLabelFor(status: DriverAccountStatus) {
    switch (status) {
      case "active":
        return t("statusActive");
      case "suspended":
        return t("statusSuspended");
      case "pending":
        return t("statusPendingAccount");
      default:
        return status;
    }
  }

  const accountStatusLabel = accountStatusLabelFor;

  const tabFiltered = useMemo(() => {
    if (tabFilter === "archived") return drivers;
    return drivers.filter((d) => {
      if (tabFilter === "pending") {
        return (
          d.workflow_status === "pending" || d.account_status === "pending"
        );
      }
      if (tabFilter === "on_duty") return d.is_on_duty;
      return true;
    });
  }, [drivers, tabFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabFiltered.filter((d) => {
      if (zoneFilter !== "all" && d.zone_id !== zoneFilter) return false;
      if (partnerFilter !== "all" && d.partner_id !== partnerFilter) return false;
      if (statusFilter !== "all" && d.account_status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.full_name.toLowerCase().includes(q) ||
        d.driver_code.toLowerCase().includes(q) ||
        (d.employee_id?.toLowerCase().includes(q) ?? false) ||
        d.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        d.partner_name.toLowerCase().includes(q) ||
        d.zone_name.toLowerCase().includes(q)
      );
    });
  }, [tabFiltered, search, zoneFilter, partnerFilter, statusFilter]);

  const sorted = useMemo(() => sortDrivers(filtered, sortKey), [filtered, sortKey]);

  const visible = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount],
  );

  const hasMore = visible.length < sorted.length;

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + DRIVERS_PAGE_SIZE, sorted.length));
        }
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, sorted.length]);

  const kpiCounts = useMemo(() => {
    const total = drivers.length;
    const activeToday = drivers.filter((d) => d.account_status === "active").length;
    const onlineNow = drivers.filter((d) => d.is_on_duty).length;
    const inactive = drivers.filter(
      (d) => d.account_status === "active" && !d.is_on_duty,
    ).length;
    const pendingVerification = drivers.filter(
      (d) => d.workflow_status === "pending" || d.account_status === "pending",
    ).length;
    const suspended = drivers.filter((d) => d.account_status === "suspended").length;

    return { total, activeToday, onlineNow, inactive, pendingVerification, suspended };
  }, [drivers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const showEmptySearch = !isLoading && drivers.length > 0 && sorted.length === 0;
  const showEmptyAll = !isLoading && drivers.length === 0;

  const allVisibleSelected =
    visible.length > 0 && visible.every((d) => selectedIds.has(d.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visible.map((d) => d.id)));
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabSelectItems = useMemo(
    () => [
      { value: "all" as const, label: t("tabAll") },
      { value: "pending" as const, label: t("tabPendingVerification") },
      { value: "on_duty" as const, label: t("tabOnDuty") },
      { value: "archived" as const, label: t("tabArchived") },
    ],
    [t],
  );

  return (
    <AppPage className="space-y-4">
      <DriversKpiStrip
        {...kpiCounts}
        labels={{
          total: t("kpiTotal"),
          activeToday: t("kpiActiveToday"),
          onlineNow: t("kpiOnlineNow"),
          inactive: t("kpiInactive"),
          pending: t("kpiPending"),
          suspended: t("kpiSuspended"),
        }}
      />

      <AppListCard
        toolbar={
          <div className="space-y-2">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
              <Select
                items={tabSelectItems}
                value={tabFilter}
                onValueChange={(value) => {
                  if (value) setTabFilter(value as DriversTabFilter);
                }}
              >
                <SelectTrigger className="h-9 w-[132px] shrink-0 cursor-pointer rounded-lg text-xs">
                  <SelectValue placeholder={t("filterView")} />
                </SelectTrigger>
                <SelectContent>
                  {tabSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-[168px] shrink-0">
                <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-9 rounded-lg bg-background ps-8 pe-8 text-xs"
                  aria-label={t("searchPlaceholder")}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted"
                    aria-label={t("clearSearch")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              <SearchSelect
                items={zoneSelectItems}
                value={zoneFilter}
                onChange={(v) => setZoneFilter(v ?? "all")}
                placeholder={t("filterZone")}
                searchPlaceholder={t("filterZone")}
                defaultLimit={8}
                recentsKey="drivers-zone-filter"
                className="h-9 w-[120px] shrink-0 text-xs"
                clearable={false}
              />
              <SearchSelect
                items={partnerSelectItems}
                value={partnerFilter}
                onChange={(v) => setPartnerFilter(v ?? "all")}
                placeholder={t("filterPartner")}
                searchPlaceholder={t("filterPartner")}
                defaultLimit={8}
                recentsKey="drivers-partner-filter"
                className="h-9 w-[120px] shrink-0 text-xs"
                clearable={false}
              />
              <Select
                items={statusSelectItems}
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter((v ?? "all") as "all" | DriverAccountStatus)
                }
              >
                <SelectTrigger className="h-9 w-[112px] shrink-0 cursor-pointer rounded-lg text-xs">
                  <SelectValue placeholder={t("filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {statusSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                items={sortSelectItems}
                value={sortKey}
                onValueChange={(v) => {
                  if (v) setSortKey(v as DriversSortKey);
                }}
              >
                <SelectTrigger className="h-9 w-[148px] shrink-0 cursor-pointer rounded-lg text-xs">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  {sortSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ms-auto flex shrink-0 items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 cursor-pointer rounded-lg"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        aria-label={t("refresh")}
                      >
                        <RefreshCw
                          className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                        />
                      </Button>
                    }
                  />
                  <TooltipContent>{t("refresh")}</TooltipContent>
                </Tooltip>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 cursor-pointer rounded-lg px-2.5"
                  onClick={() => exportDriversCsv(sorted)}
                  disabled={sorted.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="ms-1.5 hidden sm:inline">{t("export")}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 shrink-0 cursor-pointer rounded-lg px-2.5"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="ms-1.5 hidden sm:inline">{t("addDriver")}</span>
                </Button>
              </div>
            </div>
            {sorted.length > 0 ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                {t("showingCount", { visible: visible.length, total: sorted.length })}
              </p>
            ) : null}
          </div>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : showEmptyAll ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 cursor-pointer rounded-lg"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="me-2 h-3.5 w-3.5" />
              {t("addDriver")}
            </Button>
          </div>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead className={cn("w-10", TABLE_HEAD_CLASS)}>
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label={t("selectAll")}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDriverId")}</TableHead>
                  <TableHead className={cn("hidden lg:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colEmployeeId")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                  <TableHead className={cn("hidden md:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colPhone")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colZone")}</TableHead>
                  <TableHead className={cn("hidden sm:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colTodayDeliveries")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colAttendance")}</TableHead>
                  <TableHead className={cn("hidden lg:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colPasscode")}
                  </TableHead>
                  <TableHead className={cn("w-[88px] text-end", TABLE_HEAD_CLASS)}>
                    {t("colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showEmptySearch ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={12} className="border-t border-border py-12">
                      <AppEmptyState
                        title={t("emptySearchTitle")}
                        description={t("emptySearchDescription")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {visible.map((driver) => (
                      <TableRow
                        key={driver.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/40",
                          selectedIds.has(driver.id) && "bg-muted/20",
                        )}
                        onClick={() => router.push(`/drivers/${driver.id}`)}
                        onMouseEnter={() => prefetchDriverDetail(driver.id)}
                        onFocus={() => prefetchDriverDetail(driver.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/drivers/${driver.id}`);
                          }
                        }}
                        tabIndex={0}
                        aria-label={t("viewDriver")}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(driver.id)}
                            onCheckedChange={() => toggleRow(driver.id)}
                            aria-label={t("selectDriver", { name: driver.full_name })}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {formatDriverCodeDisplay(driver.driver_code)}
                        </TableCell>
                        <TableCell className="hidden font-mono text-sm text-muted-foreground lg:table-cell">
                          {driver.employee_id ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span className="truncate font-medium text-foreground">
                            {driver.full_name}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {formatPhoneInternational(driver.phone)}
                        </TableCell>
                        <TableCell>
                          <PartnerCell
                            name={driver.partner_name}
                            logoUrl={driver.partner_logo_url}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {driver.zone_name}
                        </TableCell>
                        <TableCell className="hidden text-sm tabular-nums text-muted-foreground sm:table-cell">
                          {driver.today_deliveries}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <AccountStatusPill
                              status={driver.account_status}
                              label={accountStatusLabel(driver.account_status)}
                            />
                            {driver.is_blocked ? (
                              <StatusPill variant="danger" dot={false}>
                                {t("blockedBadge")}
                              </StatusPill>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AttendancePill
                            onDuty={driver.is_on_duty}
                            onDutyLabel={t("attendanceOnDuty")}
                            offDutyLabel={t("attendanceOffDuty")}
                          />
                        </TableCell>
                        <TableCell
                          className="hidden lg:table-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PasscodeCell passcode={driver.app_passcode} />
                        </TableCell>
                        <TableCell
                          className="text-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="inline-flex items-center gap-0.5"
                            role="group"
                            aria-label={t("rowActions")}
                          >
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-8 w-8 cursor-pointer rounded-md text-muted-foreground hover:text-foreground"
                                    onClick={() => router.push(`/drivers/${driver.id}`)}
                                    aria-label={t("viewDriver")}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <TooltipContent>{t("viewDriver")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-8 w-8 cursor-pointer rounded-md text-primary hover:bg-primary/10 hover:text-primary"
                                    onClick={() =>
                                      router.push(`/drivers/${driver.id}?edit=1`)
                                    }
                                    aria-label={t("quickEdit")}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <TooltipContent>{t("quickEdit")}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {hasMore ? (
                      <TableRow ref={loadMoreRef} className="hover:bg-transparent">
                        <TableCell colSpan={12} className="border-t border-border py-4 text-center">
                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t("loadMore")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AppListCard>
      <DriverFormSheet mode="create" open={addOpen} onOpenChange={setAddOpen} />
    </AppPage>
  );
}

export function DriversPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <DriversPageSkeleton />;
  return <DriversPageContent />;
}
