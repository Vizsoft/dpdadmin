"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EllipsisVertical, Loader2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Pill, StatusDot } from "@/components/ui/metric-tile";
import { formatZoneArea, zoneAreaSqKm } from "@/lib/geo/zone-area";
import { cn } from "@/lib/utils";
import type { ZoneRow } from "./types";

function formatCreatedAt(value: string, locale: string) {
  try {
    const date = new Date(value);
    return {
      date: new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date),
      time: new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    };
  } catch {
    return { date: value.slice(0, 10), time: "--:--" };
  }
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
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(zones.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedZones = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return zones.slice(start, start + pageSize);
  }, [pageSize, safePage, zones]);

  const allVisibleSelected =
    pagedZones.length > 0 && pagedZones.every((zone) => selectedRows.has(zone.id));

  const toggleAllVisible = (checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      for (const zone of pagedZones) {
        if (checked) next.add(zone.id);
        else next.delete(zone.id);
      }
      return next;
    });
  };

  const startCount = zones.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endCount = Math.min(safePage * pageSize, zones.length);

  return (
    <aside className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white dark:bg-slate-900">
            <TableRow className="border-slate-200 dark:border-slate-700">
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
              <TableHead>{t("geofence.colStatus")}</TableHead>
              <TableHead>{t("geofence.colCreated")}</TableHead>
              <TableHead className="w-10">{t("colActions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                </TableCell>
              </TableRow>
            ) : pagedZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-sm text-slate-500 dark:text-slate-300">
                  {t("emptyTitle")}
                </TableCell>
              </TableRow>
            ) : (
              pagedZones.map((zone) => {
                const areaLabel = formatZoneArea(zoneAreaSqKm(zone.zone_type, zone.geometry));
                const created = formatCreatedAt(zone.created_at, locale);
                const selected = selectedId === zone.id;
                const typeTone = zone.geofence_kind === "inclusion" ? "emerald" : "rose";

                return (
                  <TableRow
                    key={zone.id}
                    className={cn(
                      "cursor-pointer border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      selected && "border-l-2 border-l-blue-600 bg-blue-50/40 dark:bg-blue-500/10",
                    )}
                    onClick={() => onSelect(zone.id)}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(zone.id)}
                        onCheckedChange={(checked) =>
                          setSelectedRows((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(zone.id);
                            else next.delete(zone.id);
                            return next;
                          })
                        }
                        aria-label={t("geofence.selectOne", { name: zone.name })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-start gap-2">
                        <StatusDot tone={typeTone} className="mt-1" />
                        <span>
                          <span className="block font-medium text-slate-900 dark:text-slate-100">
                            {zone.name}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-300">
                            {zone.code}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Pill tone={typeTone}>{t(`geofence.kind.${zone.geofence_kind}`)}</Pill>
                    </TableCell>
                    <TableCell className="tabular-nums text-slate-700 dark:text-slate-200">
                      {areaLabel}
                    </TableCell>
                    <TableCell>
                      <Pill tone={zone.status === "active" ? "emerald" : "slate"}>
                        {t(`geofence.status.${zone.status}`)}
                      </Pill>
                    </TableCell>
                    <TableCell>
                      <span className="block text-xs text-slate-700 dark:text-slate-200">
                        {created.date}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-300">
                        {created.time}
                      </span>
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100">
                          <EllipsisVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => onEdit(zone)}>
                            <Pencil className="h-3.5 w-3.5" />
                            {t("editZone")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
        <span className="text-slate-500 dark:text-slate-300">
          {t("showingPageRange", {
            start: startCount,
            end: endCount,
            total: zones.length,
          })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={safePage <= 1}
          >
            &lt;
          </button>
          <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 tabular-nums text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
            {safePage}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            disabled={safePage >= totalPages}
          >
            &gt;
          </button>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-7 rounded border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={30}>30 / page</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
