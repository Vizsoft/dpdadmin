"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { canManageRestaurants } from "@/lib/auth/permissions";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { RestaurantFormSheet } from "./restaurant-form-sheet";
import { useRestaurantsList } from "./use-restaurants";
import type { RestaurantRow, RestaurantStatus } from "./types";

type StatusFilter = "all" | RestaurantStatus;

function exportRestaurantsCsv(rows: RestaurantRow[]) {
  const header = [
    "id",
    "name",
    "partner_name",
    "external_merchant_id",
    "zone_name",
    "status",
    "driver_count",
    "created_at",
  ];
  const escape = (v: string | number | boolean | null) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.name,
        r.partner_name,
        r.zone_name,
        r.external_merchant_id,
        r.status,
        r.driver_count,
        r.created_at,
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
  a.download = `restaurants-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatCreatedAt(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function RestaurantsPageSkeleton() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function RestaurantsPageContent() {
  const locale = useLocale();
  const t = useTranslations("pages.restaurants");
  const { permissions, isSuperAdmin } = useAuth();
  const canManage = canManageRestaurants(new Set(permissions), isSuperAdmin);
  const queryClient = useQueryClient();

  const { data: restaurants = [], isLoading, refetch } = useRestaurantsList();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasActiveFilters = statusFilter !== "all";

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      if (
        q &&
        !(
          r.name.toLowerCase().includes(q) ||
          r.partner_name.toLowerCase().includes(q) ||
          (r.external_merchant_id?.toLowerCase().includes(q) ?? false)
        )
      ) {
        return false;
      }
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [restaurants, search, statusFilter]);

  const invalidateRestaurants = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all() });
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const handleEdit = (row: RestaurantRow) => {
    setEditing(row);
    setSheetOpen(true);
  };

  const statusFilterLabel = (value: StatusFilter) => {
    switch (value) {
      case "draft":
        return t("filterDraft");
      case "published":
        return t("filterPublished");
      case "archived":
        return t("filterArchived");
      default:
        return t("filterStatusAll");
    }
  };

  const statusBadgeLabel = (status: RestaurantStatus) => {
    switch (status) {
      case "published":
        return t("statusPublished");
      case "archived":
        return t("statusArchived");
      default:
        return t("statusDraft");
    }
  };

  const countLabel =
    visible.length !== restaurants.length
      ? `${t("totalRestaurants", { count: visible.length })} ${t("ofTotal", { total: restaurants.length })}`
      : t("totalRestaurants", { count: visible.length });

  const showEmptySearch =
    !isLoading && restaurants.length > 0 && visible.length === 0;
  const showEmptyAll = !isLoading && restaurants.length === 0;

  return (
    <>
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
              onClick={() => exportRestaurantsCsv(visible)}
              disabled={visible.length === 0}
            >
              <Download className="me-2 h-3.5 w-3.5" />
              {t("export")}
            </Button>
            {canManage ? (
              <Button
                type="button"
                size="sm"
                className="h-9 cursor-pointer rounded-lg"
                onClick={handleAdd}
              >
                <Plus className="me-2 h-3.5 w-3.5" />
                {t("addRestaurant")}
              </Button>
            ) : null}
          </div>
        }
        toolbar={
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
            <div className="flex shrink-0 items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 shrink-0 cursor-pointer rounded-lg",
                  )}
                >
                  <Filter className="me-2 h-3.5 w-3.5" />
                  {t("filter")}
                  {hasActiveFilters ? (
                    <Badge
                      variant="secondary"
                      className="ms-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                    >
                      1
                    </Badge>
                  ) : null}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{t("filterStatus")}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) =>
                      setStatusFilter((v as StatusFilter) ?? "all")
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      {t("filterStatusAll")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="draft">
                      {t("filterDraft")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="published">
                      {t("filterPublished")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="archived">
                      {t("filterArchived")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <div
                className="hidden h-6 w-px shrink-0 bg-border sm:block"
                aria-hidden
              />
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {countLabel}
              </p>
            </div>
          </div>
        }
        filterChips={
          hasActiveFilters ? (
            <>
              <Badge variant="secondary" className="gap-1 rounded-lg pe-1">
                {t("filterStatus")}: {statusFilterLabel(statusFilter)}
                <button
                  type="button"
                  className="cursor-pointer rounded p-0.5 hover:bg-muted"
                  onClick={() => setStatusFilter("all")}
                  aria-label={t("clearFilters")}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
              <button
                type="button"
                className="cursor-pointer text-xs text-primary hover:underline"
                onClick={() => setStatusFilter("all")}
              >
                {t("clearFilters")}
              </button>
            </>
          ) : undefined
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
            {canManage ? (
              <Button
                type="button"
                size="sm"
                className="mt-4 cursor-pointer rounded-lg"
                onClick={handleAdd}
              >
                <Plus className="me-2 h-3.5 w-3.5" />
                {t("addRestaurant")}
              </Button>
            ) : null}
          </div>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colRestaurant")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
                  <TableHead className={cn("hidden lg:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colZone")}
                  </TableHead>
                  <TableHead className={cn("hidden md:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colExternalId")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDrivers")}</TableHead>
                  <TableHead className={cn("hidden sm:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colCreated")}
                  </TableHead>
                  {canManage ? (
                    <TableHead className={cn("w-12 text-end", TABLE_HEAD_CLASS)}>
                      {t("colActions")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {showEmptySearch ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={canManage ? 8 : 7}
                      className="border-t border-border py-12"
                    >
                      <AppEmptyState
                        title={t("emptySearchTitle")}
                        description={t("emptySearchDescription")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((row) => (
                    <TableRow
                      key={row.id}
                      role={canManage ? "button" : undefined}
                      tabIndex={canManage ? 0 : undefined}
                      className={cn(
                        "hover:bg-muted/40",
                        canManage && "cursor-pointer",
                      )}
                      onClick={() => canManage && handleEdit(row)}
                      onKeyDown={(e) => {
                        if (canManage && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          handleEdit(row);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                            {row.logo_display_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.logo_display_url}
                                alt=""
                                className="h-full w-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-[9px] font-medium text-muted-foreground">
                                {row.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="truncate font-medium text-foreground">{row.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.partner_name}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                        {row.zone_name}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {row.external_merchant_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === "published"
                              ? "default"
                              : row.status === "archived"
                                ? "outline"
                                : "secondary"
                          }
                          className="rounded-lg"
                        >
                          {statusBadgeLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t("driversCount", { count: row.driver_count })}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatCreatedAt(row.created_at, locale)}
                      </TableCell>
                      {canManage ? (
                        <TableCell className="text-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(row);
                            }}
                            aria-label={t("editRestaurant")}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AppListCard>

      <RestaurantFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurant={editing}
        onSaved={invalidateRestaurants}
        onDeleted={invalidateRestaurants}
      />
    </>
  );
}

export function RestaurantsPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <RestaurantsPageSkeleton />;
  return <RestaurantsPageContent />;
}
