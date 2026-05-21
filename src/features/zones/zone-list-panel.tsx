"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useZoneDrivers } from "./use-zones";
import type { ZoneRow } from "./types";

function ZoneDriversList({ zoneId, expanded }: { zoneId: string; expanded: boolean }) {
  const t = useTranslations("pages.zones");
  const { data: drivers = [], isLoading } = useZoneDrivers(zoneId, expanded);

  if (!expanded) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <p className="px-3 py-2 text-xs text-muted-foreground">{t("noDrivers")}</p>
    );
  }

  return (
    <ul className="divide-y divide-border/60">
      {drivers.map((driver, index) => (
        <li
          key={driver.id}
          className="flex items-center gap-2 px-3 py-2 text-sm"
        >
          <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
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
              className="h-5 w-5 shrink-0 rounded object-contain"
            />
          ) : driver.partner_name ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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
}: {
  zones: ZoneRow[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onEdit: (zone: ZoneRow) => void;
}) {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.code.toLowerCase().includes(q),
    );
  }, [zones, search]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-card">
      <div className="space-y-3 border-b border-border p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="rounded-lg ps-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("totalZones", { count: zones.length })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("emptyTitle")}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((zone) => {
              const selected = zone.id === selectedId;
              const expanded = expandedIds.has(zone.id);

              return (
                <article
                  key={zone.id}
                  className={cn(
                    "overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow",
                    selected
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border hover:shadow-md",
                  )}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelect(zone.id)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-start"
                      >
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: zone.color }}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">
                            {zone.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            #{zone.code}
                          </p>
                        </div>
                      </button>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 cursor-pointer"
                          onClick={() => onEdit(zone)}
                          aria-label={t("editZone")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(zone.id)}
                        className="flex w-full cursor-pointer items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {t("driversAssigned", { count: zone.driver_count })}
                        </span>
                        {zone.driver_count > 0 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-accent">
                            {expanded ? t("collapse") : t("viewAll")}
                            {expanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </button>
                      <ZoneDriversList zoneId={zone.id} expanded={expanded} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
