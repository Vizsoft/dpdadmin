"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Download, Loader2, Plus, RefreshCw, Search, X } from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppEmptyState } from "@/components/app/app-empty-state";
import {
  LinkedBadge,
  WorkflowStatusPill,
} from "@/features/drivers/driver-workflow-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
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
import { useDriversList, type DriversTabFilter } from "./use-drivers";
import type { DriverListRow, DriverWorkflowStatus } from "./types";

function exportDriversCsv(rows: DriverListRow[]) {
  const header = [
    "id",
    "driver_code",
    "full_name",
    "phone",
    "partner",
    "zone",
    "workflow_status",
    "linked",
    "deliveries",
    "earnings",
  ];
  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.driver_code,
        r.full_name,
        r.phone,
        r.partner_name,
        r.zone_label,
        r.workflow_status,
        r.linked ? "yes" : "no",
        r.deliveries_display,
        r.earnings_display,
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
  const { data: drivers = [], isLoading, refetch } = useDriversList();
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<DriversTabFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const workflowLabel = (status: DriverWorkflowStatus) => {
    switch (status) {
      case "draft":
        return t("statusDraft");
      case "pending":
        return t("statusPending");
      case "approved":
        return t("statusApproved");
      default:
        return status;
    }
  };

  const tabFiltered = useMemo(() => {
    return drivers.filter((d) => {
      if (tabFilter === "all") return true;
      return d.workflow_status === tabFilter;
    });
  }, [drivers, tabFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter(
      (d) =>
        d.full_name.toLowerCase().includes(q) ||
        d.driver_code.toLowerCase().includes(q) ||
        d.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        d.partner_name.toLowerCase().includes(q) ||
        d.zone_label.toLowerCase().includes(q),
    );
  }, [tabFiltered, search]);

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

  const countLabel =
    visible.length !== drivers.length
      ? `${t("totalDrivers", { count: visible.length })} ${t("ofTotal", { total: drivers.length })}`
      : t("totalDrivers", { count: visible.length });

  const tabButtons: { id: DriversTabFilter; label: string }[] = [
    { id: "all", label: t("tabAll") },
    { id: "draft", label: t("tabDraft") },
    { id: "pending", label: t("tabPending") },
    { id: "approved", label: t("tabApproved") },
  ];

  return (
    <AppListCard
      title={t("title")}
      description={t("subtitle")}
      headerActions={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
              nativeButton={false}
              render={<Link href="/drivers/new" />}
            >
              <Plus className="me-2 h-3.5 w-3.5" />
              {t("addDriver")}
            </Button>
          </div>
      }
      toolbar={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {tabButtons.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabFilter(tab.id)}
                className={cn(
                  "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  tabFilter === tab.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
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
            <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
              {countLabel}
            </p>
          </div>
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
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Button
            type="button"
            size="sm"
            className="mt-4 cursor-pointer rounded-lg"
            nativeButton={false}
            render={<Link href="/drivers/new" />}
          >
            <Plus className="me-2 h-3.5 w-3.5" />
            {t("addDriver")}
          </Button>
        </div>
      ) : (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className={TABLE_HEAD_CLASS}>{t("colDriver")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colZone")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colLinked")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colDeliveries")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colEarnings")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showEmptySearch ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="border-t border-border py-12">
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
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => router.push(`/drivers/${driver.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/drivers/${driver.id}`);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {driver.full_name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {driver.driver_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {driver.zone_label}
                    </TableCell>
                    <TableCell>
                      <WorkflowStatusPill
                        status={driver.workflow_status}
                        label={workflowLabel(driver.workflow_status)}
                      />
                    </TableCell>
                    <TableCell>
                      <LinkedBadge
                        linked={driver.linked}
                        yesLabel={t("linkedYes")}
                        noLabel={t("linkedNo")}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {driver.deliveries_display}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {driver.earnings_display}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </AppListCard>
  );
}

export function DriversPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <DriversPageSkeleton />;
  return (
    <DriversPageContent />
  );
}
