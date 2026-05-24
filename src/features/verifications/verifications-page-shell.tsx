"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
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
import { driverSearchOptions, restaurantSearchOptions } from "@/lib/search-options";
import { cn } from "@/lib/utils";
import { useRestaurantsList } from "@/features/restaurants/use-restaurants";
import { AddVerificationDialog } from "./add-verification-dialog";
import { BulkImportDialog } from "./import/bulk-import-dialog";
import { VerificationDetailSheet } from "./verification-detail-sheet";
import { useInfiniteVerifications, useVerificationDriverOptions } from "./use-verifications";
import {
  VERIFICATION_STATUSES,
  type VerificationListRow,
  type VerificationStatus,
} from "./types";

function statusVariant(
  status: VerificationStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "matched":
      return "success";
    case "surplus":
    case "deficit":
      return "warning";
    case "conflict":
      return "danger";
    default:
      return "neutral";
  }
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeZone: "Asia/Kuwait",
    }).format(new Date(`${iso}T12:00:00Z`));
  } catch {
    return iso;
  }
}

export function VerificationsPageShell() {
  const t = useTranslations("pages.verifications");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [driverId, setDriverId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<VerificationListRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      driverId: driverId || undefined,
      restaurantId: restaurantId || undefined,
    }),
    [search, statusFilter, dateFrom, dateTo, driverId, restaurantId],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteVerifications(filters);

  const rows = useMemo(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const { data: drivers = [] } = useVerificationDriverOptions("");
  const { data: restaurants = [] } = useRestaurantsList();

  const driverFilterItems = useMemo(
    () => [
      { value: "all", label: t("filterDriverAll"), keywords: [t("filterDriverAll")] },
      ...driverSearchOptions(
        drivers.map((d) => ({
          id: d.id,
          full_name: d.full_name,
          employee_code: d.driver_code,
          employee_id: d.employee_id,
        })),
      ),
    ],
    [drivers, t],
  );

  const restaurantFilterItems = useMemo(
    () => [
      { value: "all", label: t("filterRestaurantAll"), keywords: [t("filterRestaurantAll")] },
      ...restaurantSearchOptions(
        restaurants.filter((r) => r.status === "published"),
      ),
    ],
    [restaurants, t],
  );

  const statusItems = useMemo(
    () => [
      { value: "all", label: t("filterStatusAll") },
      ...VERIFICATION_STATUSES.map((s) => ({
        value: s,
        label: t(`status.${s}`),
      })),
    ],
    [t],
  );

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  return (
    <AppPage>
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-lg"
              disabled={isRefetching}
              onClick={() => void refetch()}
            >
              <RefreshCw
                className={cn("me-2 h-3.5 w-3.5", isRefetching && "animate-spin")}
              />
              {t("refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-lg"
              nativeButton={false}
              render={<Link href="/dpd-verification/imports" />}
            >
              <ClipboardList className="me-2 h-3.5 w-3.5" />
              {t("importHistory")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-lg"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="me-2 h-3.5 w-3.5" />
              {t("bulkImport")}
            </Button>
            <Button
              type="button"
              size="sm"
              className="cursor-pointer rounded-lg"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="me-2 h-3.5 w-3.5" />
              {t("addVerification")}
            </Button>
          </div>
        }
      />

      <AppListCard
        toolbar={
          <div className="flex flex-col gap-3 p-4">
            <div className="relative max-w-md">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="rounded-lg ps-9"
              />
              {search ? (
                <button
                  type="button"
                  className="absolute end-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground"
                  onClick={() => setSearch("")}
                  aria-label={t("clearSearch")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                items={statusItems}
                value={statusFilter}
                onValueChange={(v) => {
                  if (v) setStatusFilter(v as VerificationStatus | "all");
                }}
              >
                <SelectTrigger className="h-8 w-40 cursor-pointer rounded-lg text-sm">
                  <SelectValue placeholder={t("filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value} label={item.label}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-36 rounded-lg text-sm"
                aria-label={t("dateFrom")}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-36 rounded-lg text-sm"
                aria-label={t("dateTo")}
              />
              <SearchSelect
                items={driverFilterItems}
                value={driverId || "all"}
                onChange={(v) => setDriverId(v === "all" ? "" : (v ?? ""))}
                placeholder={t("filterDriver")}
                searchPlaceholder={t("filterDriver")}
                defaultLimit={10}
                recentsKey="verifications-driver-filter"
                className="h-8 w-44 text-sm"
                clearable={false}
              />
              <SearchSelect
                items={restaurantFilterItems}
                value={restaurantId || "all"}
                onChange={(v) => setRestaurantId(v === "all" ? "" : (v ?? ""))}
                placeholder={t("filterRestaurant")}
                searchPlaceholder={t("filterRestaurant")}
                defaultLimit={10}
                recentsKey="verifications-restaurant-filter"
                className="h-8 w-44 text-sm"
                clearable={false}
              />
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12">
            <AppEmptyState
              title={t("emptyTitle")}
              description={t("emptyDescription")}
            />
          </div>
        ) : (
          <CardContent className="divide-y divide-border p-0">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40"
                onClick={() => {
                  setSelected(row);
                  setDetailOpen(true);
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.driver_name}
                    <span className="ms-2 font-normal text-muted-foreground">
                      {row.restaurant_name}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(row.service_date)}
                    {row.employee_id ? ` · ${row.employee_id}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-end text-sm tabular-nums">
                  <span className="font-medium">{row.matched_count}</span>
                  <span className="text-muted-foreground"> / {row.reported_count}</span>
                </div>
                <StatusPill variant={statusVariant(row.status)} dot={false}>
                  {t(`status.${row.status}`)}
                </StatusPill>
              </button>
            ))}
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </CardContent>
        )}
      </AppListCard>

      <AddVerificationDialog open={addOpen} onOpenChange={setAddOpen} />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <VerificationDetailSheet
        row={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </AppPage>
  );
}
