"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Camera,
  Download,
  Eye,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { TabBar } from "@/components/dashboard/tab-bar";
import { StatusPill } from "@/components/dashboard/status-pill";
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
import { useDeliveriesList, type DeliveriesTabFilter } from "./use-deliveries";
import { DeliveryDetailSheet } from "./delivery-detail-sheet";
import type { DeliveryListRow, DeliveryStatus } from "./types";

function deliveryStatusVariant(
  status: DeliveryStatus,
): "success" | "warning" | "danger" {
  switch (status) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

function formatDateTime(iso: string): string {
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

function exportDeliveriesCsv(rows: DeliveryListRow[]) {
  const header = [
    "id",
    "driver_name",
    "driver_code",
    "partner",
    "zone",
    "status",
    "external_order_id",
    "delivered_at",
  ];
  const escape = (v: string | number | boolean | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.short_id,
        r.driver_name,
        r.driver_code,
        r.partner_name,
        r.zone_name,
        r.status,
        r.external_order_id ?? "",
        r.delivered_at,
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
  a.download = `deliveries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DeliveriesPageSkeleton() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function DeliveriesPageContent() {
  const t = useTranslations("pages.deliveries");
  const { data: deliveries = [], isLoading, refetch } = useDeliveriesList();

  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<DeliveriesTabFilter>("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryListRow | null>(null);

  const zoneSelectItems = useMemo(() => {
    const uniqueZones = new Map<string, string>();
    for (const d of deliveries) {
      if (d.zone_id && d.zone_name !== "—") {
        uniqueZones.set(d.zone_id, d.zone_name);
      }
    }
    return [
      { value: "all", label: t("filterZoneAll") },
      ...selectOptionsFrom(
        [...uniqueZones.entries()],
        ([id]) => id,
        ([, name]) => name,
      ),
    ];
  }, [deliveries, t]);

  const partnerSelectItems = useMemo(() => {
    const uniquePartners = new Map<string, string>();
    for (const d of deliveries) {
      if (d.partner_id && d.partner_name !== "—") {
        uniquePartners.set(d.partner_id, d.partner_name);
      }
    }
    return [
      { value: "all", label: t("filterPartnerAll") },
      ...selectOptionsFrom(
        [...uniquePartners.entries()],
        ([id]) => id,
        ([, name]) => name,
      ),
    ];
  }, [deliveries, t]);

  const tabFiltered = useMemo(() => {
    return deliveries.filter((d) => {
      if (tabFilter === "pending") return d.status === "pending";
      if (tabFilter === "verified") return d.status === "verified";
      if (tabFilter === "rejected") return d.status === "rejected";
      return true;
    });
  }, [deliveries, tabFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabFiltered.filter((d) => {
      if (zoneFilter !== "all" && d.zone_id !== zoneFilter) return false;
      if (partnerFilter !== "all" && d.partner_id !== partnerFilter) return false;
      if (!q) return true;
      return (
        d.driver_name.toLowerCase().includes(q) ||
        d.driver_code.toLowerCase().includes(q) ||
        d.short_id.toLowerCase().includes(q) ||
        (d.external_order_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [tabFiltered, search, zoneFilter, partnerFilter]);

  const kpis = useMemo(() => {
    const total = deliveries.length;
    const verified = deliveries.filter((d) => d.status === "verified").length;
    const pending = deliveries.filter((d) => d.status === "pending").length;
    const rejected = deliveries.filter((d) => d.status === "rejected").length;

    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuwait",
    }).format(new Date());
    const todayCount = deliveries.filter((d) => {
      try {
        const dDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kuwait",
        }).format(new Date(d.delivered_at));
        return dDate === todayStr;
      } catch {
        return false;
      }
    }).length;

    return [
      { label: t("kpiTotal"), value: total },
      { label: t("kpiVerified"), value: verified },
      { label: t("kpiPending"), value: pending },
      { label: t("kpiRejected"), value: rejected },
      { label: t("kpiToday"), value: todayCount },
    ];
  }, [deliveries, t]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const showEmptySearch =
    !isLoading && deliveries.length > 0 && visible.length === 0;
  const showEmptyAll = !isLoading && deliveries.length === 0;

  const tabItems = [
    { id: "all" as const, label: t("tabAll") },
    { id: "pending" as const, label: t("tabPending") },
    { id: "verified" as const, label: t("tabVerified") },
    { id: "rejected" as const, label: t("tabRejected") },
  ];

  const hasActiveFilters = zoneFilter !== "all" || partnerFilter !== "all";

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
              onClick={() => exportDeliveriesCsv(visible)}
              disabled={visible.length === 0}
            >
              <Download className="me-2 h-3.5 w-3.5" />
              {t("export")}
            </Button>
          </>
        }
      />

      <KpiGrid items={kpis} />

      <AppListCard
        toolbar={
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <TabBar
                items={tabItems}
                activeId={tabFilter}
                onSelect={(id) => setTabFilter(id as DeliveriesTabFilter)}
                className="border-b-0"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  items={zoneSelectItems}
                  value={zoneFilter}
                  onValueChange={(v) => setZoneFilter(v ?? "all")}
                >
                  <SelectTrigger className="h-9 w-full min-w-[140px] cursor-pointer rounded-lg sm:w-[160px]">
                    <SelectValue placeholder={t("filterZone")} />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneSelectItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        className="cursor-pointer"
                      >
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
                  <SelectTrigger className="h-9 w-full min-w-[140px] cursor-pointer rounded-lg sm:w-[160px]">
                    <SelectValue placeholder={t("filterPartner")} />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerSelectItems.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                        className="cursor-pointer"
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
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
              </div>
            </div>
            {(hasActiveFilters || search) && (
              <p className="text-sm tabular-nums text-muted-foreground">
                {t("totalDeliveries", { count: visible.length })}
                {visible.length !== deliveries.length
                  ? ` ${t("ofTotal", { total: deliveries.length })}`
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
          </div>
        ) : (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/5">
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDeliveryId")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDriver")}</TableHead>
                  <TableHead className={cn("hidden md:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colPartner")}
                  </TableHead>
                  <TableHead className={cn("hidden sm:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colZone")}
                  </TableHead>
                  <TableHead className={cn("text-end", TABLE_HEAD_CLASS)}>
                    {t("colStatus")}
                  </TableHead>
                  <TableHead className={cn("hidden lg:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colOrderId")}
                  </TableHead>
                  <TableHead className={cn("hidden sm:table-cell", TABLE_HEAD_CLASS)}>
                    {t("colDeliveredAt")}
                  </TableHead>
                  <TableHead className={cn("w-12 text-end", TABLE_HEAD_CLASS)}>
                    {t("colActions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showEmptySearch ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="border-t border-border py-12">
                      <AppEmptyState
                        title={t("emptySearchTitle")}
                        description={t("emptySearchDescription")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((delivery) => (
                    <TableRow
                      key={delivery.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          #{delivery.short_id}
                          {delivery.order_proof_url ? (
                            <Camera
                              className="h-3.5 w-3.5 shrink-0 text-primary/70"
                              aria-label={t("hasProof")}
                            />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {delivery.driver_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            #{delivery.driver_code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
                            {delivery.partner_logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={delivery.partner_logo_url}
                                alt=""
                                className="h-full w-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-muted-foreground">
                                {delivery.partner_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="truncate text-sm text-foreground">
                            {delivery.partner_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {delivery.zone_name}
                      </TableCell>
                      <TableCell className="text-end">
                        <StatusPill variant={deliveryStatusVariant(delivery.status)} dot>
                          {t(`status${delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}` as "statusPending")}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="hidden font-mono text-sm tabular-nums text-muted-foreground lg:table-cell">
                        {delivery.external_order_id ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatDateTime(delivery.delivered_at)}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label={t("rowActions")}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => setSelectedDelivery(delivery)}
                            >
                              <Eye className="me-2 h-3.5 w-3.5" />
                              {t("viewDetail")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </AppListCard>

      <DeliveryDetailSheet
        delivery={selectedDelivery}
        open={selectedDelivery !== null}
        onClose={() => setSelectedDelivery(null)}
        onUpdated={() => void refetch()}
      />
    </AppPage>
  );
}

export function DeliveriesPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <DeliveriesPageSkeleton />;
  return <DeliveriesPageContent />;
}
