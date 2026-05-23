"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectOptionsFrom } from "@/lib/select-items";
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
import { useDriversList, useDriverDetail, type DriversTabFilter } from "./use-drivers";
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
  const searchParams = useSearchParams();
  const [tabFilter, setTabFilter] = useState<DriversTabFilter>("all");
  const listArchived = tabFilter === "archived";
  const { data: drivers = [], isLoading, refetch } = useDriversList(listArchived);
  const { data: formOptions } = useDriverFormOptions();
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DriverAccountStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const { data: editDriver } = useDriverDetail(editDriverId ?? "");

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setAddOpen(true);
      router.replace("/drivers");
    }
    const editId = searchParams.get("edit");
    if (editId) {
      setEditDriverId(editId);
      setEditOpen(true);
      router.replace("/drivers");
    }
  }, [searchParams, router]);

  const zoneSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterZoneAll") },
      ...selectOptionsFrom(
        formOptions?.zones ?? [],
        (z) => z.id,
        (z) => z.name,
      ),
    ],
    [formOptions?.zones, t],
  );

  const partnerSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterPartnerAll") },
      ...selectOptionsFrom(
        formOptions?.partners ?? [],
        (p) => p.id,
        (p) => p.name,
      ),
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

  const visible = useMemo(() => {
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

  const showEmptySearch =
    !isLoading && drivers.length > 0 && visible.length === 0;
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

  const openEditDriver = (id: string) => {
    setEditDriverId(id);
    setEditOpen(true);
  };

  const hasActiveFilters =
    zoneFilter !== "all" || partnerFilter !== "all" || statusFilter !== "all";

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
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
              <Select
                items={tabSelectItems}
                value={tabFilter}
                onValueChange={(value) => {
                  if (value) setTabFilter(value as DriversTabFilter);
                }}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg xl:w-[200px]">
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

              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <div className="relative min-w-0 flex-1 sm:min-w-[220px] sm:max-w-[320px]">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-9 rounded-lg bg-background ps-9 pe-9"
                    aria-label={t("searchPlaceholder")}
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute end-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted"
                      aria-label={t("clearSearch")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <Select
                  items={zoneSelectItems}
                  value={zoneFilter}
                  onValueChange={(v) => setZoneFilter(v ?? "all")}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg sm:w-[150px]">
                    <SelectValue placeholder={t("filterZone")} />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  items={partnerSelectItems}
                  value={partnerFilter}
                  onValueChange={(v) => setPartnerFilter(v ?? "all")}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg sm:w-[150px]">
                    <SelectValue placeholder={t("filterPartner")} />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerSelectItems.map((item) => (
                      <SelectItem key={item.value} value={item.value} className="cursor-pointer">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  items={statusSelectItems}
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter((v ?? "all") as "all" | DriverAccountStatus)
                  }
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg sm:w-[150px]">
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
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 cursor-pointer rounded-lg"
                  onClick={handleRefresh}
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
                  onClick={() => exportDriversCsv(visible)}
                  disabled={visible.length === 0}
                >
                  <Download className="me-2 h-3.5 w-3.5" />
                  {t("export")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 cursor-pointer rounded-lg"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="me-2 h-3.5 w-3.5" />
                  {t("addDriver")}
                </Button>
              </div>
            </div>
            {(hasActiveFilters || search) && (
              <p className="text-sm tabular-nums text-muted-foreground">
                {t("totalDrivers", { count: visible.length })}
                {visible.length !== drivers.length
                  ? ` ${t("ofTotal", { total: drivers.length })}`
                  : null}
              </p>
            )}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {showEmptySearch ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={11} className="border-t border-border py-12">
                      <AppEmptyState
                        title={t("emptySearchTitle")}
                        description={t("emptySearchDescription")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/40",
                        selectedIds.has(driver.id) && "bg-muted/20",
                      )}
                      onClick={() => openEditDriver(driver.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openEditDriver(driver.id);
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
                        <AccountStatusPill
                          status={driver.account_status}
                          label={accountStatusLabel(driver.account_status)}
                        />
                      </TableCell>
                      <TableCell>
                        <AttendancePill
                          onDuty={driver.is_on_duty}
                          onDutyLabel={t("attendanceOnDuty")}
                          offDutyLabel={t("attendanceOffDuty")}
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        <PasscodeCell passcode={driver.app_passcode} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AppListCard>
      <DriverFormSheet mode="create" open={addOpen} onOpenChange={setAddOpen} />
      <DriverFormSheet
        mode="edit"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditDriverId(null);
        }}
        driver={editDriver}
        intakeId={editDriver?.intake_id ?? editDriver?.id}
        onSaved={() => void refetch()}
      />
    </AppPage>
  );
}

export function DriversPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <DriversPageSkeleton />;
  return <DriversPageContent />;
}
