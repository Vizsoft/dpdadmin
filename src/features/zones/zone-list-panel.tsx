"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Square,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useZoneDrivers } from "./use-zones";
import {
  DEFAULT_ZONE_LIST_PREFS,
  loadZoneListPrefs,
  saveZoneListPrefs,
  type ZoneSortKey,
} from "./zone-list-prefs";
import { formatZoneArea, zoneAreaSqKm } from "@/lib/geo/zone-area";
import { Badge } from "@/components/ui/badge";
import type { ZoneRow } from "./types";

function formatCreatedAt(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function compareZones(a: ZoneRow, b: ZoneRow, sort: ZoneSortKey): number {
  switch (sort) {
    case "nameAsc":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "nameDesc":
      return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
    case "newest":
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    case "oldest":
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    case "driversDesc":
      return b.driver_count - a.driver_count || a.name.localeCompare(b.name);
    case "driversAsc":
      return a.driver_count - b.driver_count || a.name.localeCompare(b.name);
    default:
      return 0;
  }
}

function ZoneDriversList({ zoneId, expanded }: { zoneId: string; expanded: boolean }) {
  const t = useTranslations("pages.zones");
  const { data: drivers = [], isLoading } = useZoneDrivers(zoneId, expanded);

  if (!expanded) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("noDrivers")}</p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {drivers.map((driver, index) => (
        <li
          key={driver.id}
          className="flex items-center gap-2 px-2 py-1.5 text-xs"
        >
          <span className="w-4 shrink-0 text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            #{driver.driver_code}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {driver.full_name ?? t("unknownDriver")}
          </span>
          {driver.partner_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={driver.partner_logo_url}
              alt={driver.partner_name ?? ""}
              className="h-4 w-4 shrink-0 rounded object-contain"
            />
          ) : driver.partner_name ? (
            <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
              {driver.partner_name}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ZoneListPanel({
  zones,
  selectedId,
  isLoading,
  onSelect,
  onEdit,
  onRefresh,
  isRefreshing,
  onAdd,
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onEdit: (zone: ZoneRow) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAdd?: () => void;
}) {
  const t = useTranslations("pages.zones");
  const locale = useLocale();
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ZoneSortKey>(DEFAULT_ZONE_LIST_PREFS.sort);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSort(loadZoneListPrefs().sort);
  }, []);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? zones.filter(
          (z) =>
            z.name.toLowerCase().includes(q) ||
            z.code.toLowerCase().includes(q),
        )
      : zones;
    return [...filtered].sort((a, b) => compareZones(a, b, sort));
  }, [zones, search, sort]);

  const handleSortChange = (value: ZoneSortKey) => {
    setSort(value);
    saveZoneListPrefs({ sort: value });
  };

  const handleRowClick = (zone: ZoneRow) => {
    onSelect(zone.id);
    setExpandedId((prev) => (prev === zone.id ? null : zone.id));
  };

  const allVisibleSelected =
    filteredSorted.length > 0 && filteredSorted.every((zone) => selectedRows.has(zone.id));

  const toggleRowSelection = (zoneId: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(zoneId);
      else next.delete(zoneId);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      for (const zone of filteredSorted) {
        if (checked) next.add(zone.id);
        else next.delete(zone.id);
      }
      return next;
    });
  };

  return (
    <aside className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="space-y-2 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {t("title")}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t("totalZones", { count: zones.length })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onRefresh ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="cursor-pointer"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label={t("refresh")}
                title={t("refresh")}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                />
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-input bg-background px-2 text-xs font-medium shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <Filter className="me-1 h-3.5 w-3.5" />
                {t("geofence.bulkActions")}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem disabled>
                  {t("geofence.bulkEnable")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  {t("geofence.bulkDisable")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  {t("geofence.bulkDelete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onAdd ? (
              <Button
                type="button"
                size="sm"
                className="h-8 cursor-pointer rounded-lg px-2.5 text-xs"
                onClick={onAdd}
              >
                <Plus className="me-1 h-3.5 w-3.5" />
                {t("geofence.createButton")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="relative">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("placeholders.searchZones")}
              className="h-8 rounded-lg ps-8 text-xs"
              aria-label={t("placeholders.searchZones")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="zone-sort" className="sr-only">
              {t("sortBy")}
            </Label>
            <Select value={sort} onValueChange={(v) => handleSortChange(v as ZoneSortKey)}>
              <SelectTrigger id="zone-sort" size="sm" className="h-8 w-full text-xs">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nameAsc">{t("sort.nameAsc")}</SelectItem>
                <SelectItem value="nameDesc">{t("sort.nameDesc")}</SelectItem>
                <SelectItem value="newest">{t("sort.newest")}</SelectItem>
                <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
                <SelectItem value="driversDesc">{t("sort.driversDesc")}</SelectItem>
                <SelectItem value="driversAsc">{t("sort.driversAsc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search.trim() ? t("noSearchResults") : t("emptyTitle")}
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5 text-[11px]">
              <span className="text-muted-foreground">
                {t("geofence.selectedCount", { count: selectedRows.size })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedRows(new Set())}
                className="cursor-pointer text-primary hover:underline"
              >
                {t("geofence.clearSelection")}
              </button>
            </div>
            <Table>
              <TableHeader className="sticky top-0 z-[1] bg-card">
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => toggleAllVisible(Boolean(checked))}
                      aria-label={t("geofence.selectAll")}
                    />
                  </TableHead>
                  <TableHead>{t("geofence.colName")}</TableHead>
                  <TableHead>{t("geofence.colType")}</TableHead>
                  <TableHead>{t("geofence.colArea")}</TableHead>
                  <TableHead>{t("geofence.colCreated")}</TableHead>
                  <TableHead>{t("geofence.colStatus")}</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSorted.map((zone) => {
                  const selected = zone.id === selectedId;
                  const expanded = expandedId === zone.id;
                  const areaLabel = formatZoneArea(
                    zoneAreaSqKm(zone.zone_type, zone.geometry),
                  );

                  return (
                    <Fragment key={zone.id}>
                      <TableRow
                        key={zone.id}
                        className={cn(selected && "bg-accent/10")}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(zone.id)}
                            onCheckedChange={(checked) =>
                              toggleRowSelection(zone.id, Boolean(checked))
                            }
                            aria-label={t("geofence.selectOne", { name: zone.name })}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleRowClick(zone)}
                            className="flex w-full cursor-pointer items-center gap-2 text-left"
                          >
                            <span
                              aria-hidden
                              className="h-8 w-1 shrink-0 rounded-full"
                              style={{ backgroundColor: zone.color }}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {zone.name}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                #{zone.code}
                              </span>
                            </span>
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={zone.geofence_kind === "exclusion" ? "destructive" : "secondary"}
                            className="text-[10px]"
                          >
                            {t(`geofence.kind.${zone.geofence_kind}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] tabular-nums text-muted-foreground">
                          {areaLabel}
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {formatCreatedAt(zone.created_at, locale)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={zone.status === "active" ? "default" : "outline"}
                            className="text-[10px]"
                          >
                            {t(`geofence.status.${zone.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                              <EllipsisVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={() => {
                                  onSelect(zone.id);
                                  setExpandedId(zone.id);
                                }}
                              >
                                {expanded ? (
                                  <CheckSquare2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Square className="h-3.5 w-3.5" />
                                )}
                                {expanded
                                  ? t("geofence.hideDrivers")
                                  : t("geofence.showDrivers")}
                              </DropdownMenuItem>
                              {canManage ? (
                                <DropdownMenuItem onClick={() => onEdit(zone)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  {t("editZone")}
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {expanded ? (
                        <TableRow key={`${zone.id}-drivers`}>
                          <TableCell colSpan={7} className="bg-muted/20">
                            <div className="rounded-lg border border-border/60 bg-muted/30">
                              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1.5">
                                <span className="text-[11px] text-muted-foreground">
                                  {t("driversAssigned", { count: zone.driver_count })}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                                    zone.driver_count > 0
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  <Users className="h-3 w-3" />
                                  {zone.driver_count}
                                </span>
                              </div>
                              <ZoneDriversList zoneId={zone.id} expanded />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </aside>
  );
}
