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
import { AppListCard } from "@/components/app/app-list-card";
import {
  AppDataTable,
  AppDataTableEmpty,
  AppDataTableRow,
  TableCell,
} from "@/components/app/app-data-table";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { TabBar } from "@/components/dashboard/tab-bar";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { SearchSelect } from "@/components/ui/search-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";
import { queryKeys } from "@/lib/query/query-keys";
import { useRealtimeInvalidator } from "@/lib/realtime/use-realtime-invalidator";
import { useDeliveriesList, type DeliveriesTabFilter } from "./use-deliveries";
import { DeliveryDetailSheet } from "./delivery-detail-sheet";
import {
  CANCEL_REASON_CODES,
  parseCancelReason,
  type CancelReasonCode,
} from "./parse-cancel-reason";
import { formatRelativeMinutesAgo } from "./delivery-sort-utils";
import { resolveStatusVariant } from "@/lib/ui/resolve-status-variant";
import type { DeliveryListRow, DeliveryStatus } from "./types";

function statusMessageKey(status: DeliveryStatus) {
  switch (status) {
    case "verified":
      return "statusVerified";
    case "rejected":
      return "statusRejected";
    case "under_review":
      return "statusUnderReview";
    case "in_transit":
      return "statusInTransit";
    case "cancelled":
      return "statusCancelled";
    case "pending":
    default:
      return "statusPending";
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
    "pickup_at",
    "delivered_at",
    "cancelled_at",
    "cancel_reason_code",
    "cancel_reason_note",
  ];
  const escape = (v: string | number | boolean | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) => {
      const parsed = parseCancelReason(r.cancel_reason);
      return [
        r.short_id,
        r.driver_name,
        r.driver_code,
        r.partner_name,
        r.zone_name,
        r.status,
        r.external_order_id ?? "",
        r.pickup_at ?? "",
        r.delivered_at ?? "",
        r.cancelled_at ?? "",
        parsed?.code ?? "",
        parsed?.note ?? "",
      ]
        .map(escape)
        .join(",");
    }),
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

  // Live refresh: re-fetch the list whenever a delivery row changes in Postgres
  // (insert/update/delete). Keeps the table in sync without a manual refresh
  // when riders or other admins act on deliveries.
  useRealtimeInvalidator({
    channel: "admin-deliveries-list",
    tables: [{ table: "deliveries" }],
    invalidateKeys: [queryKeys.deliveries.all(), queryKeys.verifications.all()],
  });

  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<DeliveriesTabFilter>("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [cancelReasonFilter, setCancelReasonFilter] = useState<"all" | CancelReasonCode>("all");
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
      { value: "all", label: t("filterZoneAll"), keywords: [t("filterZoneAll")] },
      ...[...uniqueZones.entries()].map(([id, name]) => ({
        value: id,
        label: name,
        keywords: [name, id],
      })),
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
      { value: "all", label: t("filterPartnerAll"), keywords: [t("filterPartnerAll")] },
      ...[...uniquePartners.entries()].map(([id, name]) => ({
        value: id,
        label: name,
        keywords: [name, id],
      })),
    ];
  }, [deliveries, t]);

  const tabFiltered = useMemo(() => {
    return deliveries.filter((d) => {
      if (tabFilter === "active") return d.status === "in_transit";
      if (tabFilter === "pending") return d.status === "pending";
      if (tabFilter === "under_review") return d.status === "under_review";
      if (tabFilter === "verified") return d.status === "verified";
      if (tabFilter === "rejected") return d.status === "rejected";
      if (tabFilter === "cancelled") return d.status === "cancelled";
      return true;
    });
  }, [deliveries, tabFilter]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabFiltered.filter((d) => {
      if (zoneFilter !== "all" && d.zone_id !== zoneFilter) return false;
      if (partnerFilter !== "all" && d.partner_id !== partnerFilter) return false;
      if (tabFilter === "cancelled" && cancelReasonFilter !== "all") {
        const parsed = parseCancelReason(d.cancel_reason);
        if (parsed?.code !== cancelReasonFilter) return false;
      }
      if (!q) return true;
      return (
        d.driver_name.toLowerCase().includes(q) ||
        d.driver_code.toLowerCase().includes(q) ||
        d.short_id.toLowerCase().includes(q) ||
        (d.external_order_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [tabFiltered, search, zoneFilter, partnerFilter, tabFilter, cancelReasonFilter]);

  const kpis = useMemo(() => {
    const total = deliveries.length;
    const verified = deliveries.filter((d) => d.status === "verified").length;
    const pending = deliveries.filter((d) => d.status === "pending").length;
    const rejected = deliveries.filter((d) => d.status === "rejected").length;
    const active = deliveries.filter((d) => d.status === "in_transit").length;
    const cancelled = deliveries.filter((d) => d.status === "cancelled").length;

    return [
      { label: t("kpiTotal"), value: total },
      { label: t("kpiActive"), value: active },
      { label: t("kpiVerified"), value: verified },
      { label: t("kpiPending"), value: pending },
      { label: t("kpiRejected"), value: rejected },
      { label: t("kpiCancelled"), value: cancelled },
    ];
  }, [deliveries, t]);

  const cancelReasonSelectItems = useMemo(
    () => [
      { value: "all", label: t("filterCancelReasonAll"), keywords: [t("filterCancelReasonAll")] },
      ...CANCEL_REASON_CODES.map((code) => ({
        value: code,
        label: t(`cancelReason.${code}`),
        keywords: [code, t(`cancelReason.${code}`)],
      })),
    ],
    [t],
  );

  function formatWhenColumn(delivery: DeliveryListRow): string {
    if (delivery.status === "in_transit" && delivery.pickup_at) {
      const mins = formatRelativeMinutesAgo(delivery.pickup_at);
      return t("pickedUpAgo", { minutes: mins });
    }
    if (delivery.status === "cancelled" && delivery.cancelled_at) {
      return formatDateTime(delivery.cancelled_at);
    }
    if (delivery.delivered_at) {
      return formatDateTime(delivery.delivered_at);
    }
    if (delivery.pickup_at) {
      return formatDateTime(delivery.pickup_at);
    }
    return "—";
  }

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

  const tableColumns = useMemo(
    () => [
      { id: "deliveryId", label: t("colDeliveryId") },
      { id: "driver", label: t("colDriver") },
      { id: "partner", label: t("colPartner"), className: "hidden md:table-cell" },
      { id: "zone", label: t("colZone"), className: "hidden sm:table-cell" },
      { id: "status", label: t("colStatus"), className: "text-end" },
      { id: "orderId", label: t("colOrderId"), className: "hidden lg:table-cell" },
      { id: "when", label: t("colWhen"), className: "hidden sm:table-cell" },
      { id: "actions", label: t("colActions"), className: "w-12 text-end" },
    ],
    [t],
  );

  const tabItems = [
    { id: "all" as const, label: t("tabAll") },
    { id: "active" as const, label: t("tabActive") },
    { id: "pending" as const, label: t("tabPending") },
    { id: "under_review" as const, label: t("tabUnderReview") },
    { id: "verified" as const, label: t("tabVerified") },
    { id: "rejected" as const, label: t("tabRejected") },
    { id: "cancelled" as const, label: t("tabCancelled") },
  ];

  const hasActiveFilters =
    zoneFilter !== "all" ||
    partnerFilter !== "all" ||
    (tabFilter === "cancelled" && cancelReasonFilter !== "all");

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
                onSelect={(id) => {
                  setTabFilter(id as DeliveriesTabFilter);
                  if (id !== "cancelled") setCancelReasonFilter("all");
                }}
                className="border-b-0"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {tabFilter === "cancelled" ? (
                  <SearchSelect
                    items={cancelReasonSelectItems}
                    value={cancelReasonFilter}
                    onChange={(v) =>
                      setCancelReasonFilter((v as CancelReasonCode | "all") ?? "all")
                    }
                    placeholder={t("filterCancelReason")}
                    searchPlaceholder={t("filterCancelReason")}
                    defaultLimit={8}
                    recentsKey="deliveries-cancel-reason-filter"
                    className="w-full min-w-[140px] sm:w-[180px]"
                    clearable={false}
                  />
                ) : null}
                <SearchSelect
                  items={zoneSelectItems}
                  value={zoneFilter}
                  onChange={(v) => setZoneFilter(v ?? "all")}
                  placeholder={t("filterZone")}
                  searchPlaceholder={t("filterZone")}
                  defaultLimit={8}
                  recentsKey="deliveries-zone-filter"
                  className="w-full min-w-[140px] sm:w-[160px]"
                  clearable={false}
                />
                <SearchSelect
                  items={partnerSelectItems}
                  value={partnerFilter}
                  onChange={(v) => setPartnerFilter(v ?? "all")}
                  placeholder={t("filterPartner")}
                  searchPlaceholder={t("filterPartner")}
                  defaultLimit={8}
                  recentsKey="deliveries-partner-filter"
                  className="w-full min-w-[140px] sm:w-[160px]"
                  clearable={false}
                />
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
            <AppDataTable
              columns={tableColumns}
              headerRowClassName="bg-primary/5 hover:bg-primary/5"
              empty={
                showEmptySearch ? (
                  <AppDataTableEmpty>
                    <AppEmptyState
                      title={t("emptySearchTitle")}
                      description={t("emptySearchDescription")}
                    />
                  </AppDataTableEmpty>
                ) : undefined
              }
            >
              {!showEmptySearch
                ? visible.map((delivery) => (
                    <AppDataTableRow
                      key={delivery.id}
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          #{delivery.short_id}
                          {delivery.order_proof_url ||
                          delivery.pickup_proof_url ||
                          delivery.cancel_proof_url ? (
                            <Camera
                              className="h-3.5 w-3.5 shrink-0 text-primary/70"
                              aria-label={t("hasProof")}
                            />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="inline-flex flex-wrap items-center gap-1.5 text-sm font-medium text-foreground">
                            {delivery.driver_name}
                            {delivery.gps_is_mocked ? (
                              <span
                                className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive"
                                title={t("mockGpsTooltip")}
                              >
                                {t("mockGpsBadge")}
                              </span>
                            ) : null}
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
                        <StatusPill variant={resolveStatusVariant(delivery.status)} dot>
                          {t(statusMessageKey(delivery.status))}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="hidden font-mono text-sm tabular-nums text-muted-foreground lg:table-cell">
                        {delivery.external_order_id ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatWhenColumn(delivery)}
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
                    </AppDataTableRow>
                  ))
                : null}
            </AppDataTable>
          </CardContent>
        )}
      </AppListCard>

      <DeliveryDetailSheet
        delivery={selectedDelivery}
        open={selectedDelivery !== null}
        onClose={() => setSelectedDelivery(null)}
        onUpdated={async () => {
          const { data } = await refetch();
          if (selectedDelivery && data) {
            const fresh = data.find((row) => row.id === selectedDelivery.id);
            if (fresh) setSelectedDelivery(fresh);
          }
        }}
      />
    </AppPage>
  );
}

export function DeliveriesPageShell() {
  const mounted = useHasMounted();
  if (!mounted) return <DeliveriesPageSkeleton />;
  return <DeliveriesPageContent />;
}
