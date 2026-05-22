"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useZoneDrivers } from "./use-zones";
import {
  DEFAULT_ZONE_LIST_PREFS,
  loadZoneListPrefs,
  saveZoneListPrefs,
  type ZoneSortKey,
} from "./zone-list-prefs";
import type { ZoneRow } from "./types";

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
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ZoneSortKey>(DEFAULT_ZONE_LIST_PREFS.sort);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-card">
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
            {onAdd ? (
              <Button
                type="button"
                size="sm"
                className="h-8 cursor-pointer rounded-lg px-2.5 text-xs"
                onClick={onAdd}
              >
                <Plus className="me-1 h-3.5 w-3.5" />
                {t("addZone")}
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
          <div className="space-y-0.5">
            {filteredSorted.map((zone) => {
              const selected = zone.id === selectedId;
              const expanded = expandedId === zone.id;

              return (
                <div key={zone.id} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => handleRowClick(zone)}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-start transition-colors",
                      selected
                        ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                        : "border-transparent hover:border-border hover:bg-muted/50",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-8 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {zone.name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      #{zone.code}
                    </span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                        zone.driver_count > 0
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Users className="h-3 w-3" />
                      {zone.driver_count}
                    </span>
                    {expanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {expanded ? (
                    <div className="mx-1 mb-1 rounded-lg border border-border/60 bg-muted/30">
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1.5">
                        <span className="text-[11px] text-muted-foreground">
                          {t("driversAssigned", { count: zone.driver_count })}
                        </span>
                        {canManage ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 cursor-pointer gap-1 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(zone);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                            {t("editZone")}
                          </Button>
                        ) : null}
                      </div>
                      <ZoneDriversList zoneId={zone.id} expanded />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
