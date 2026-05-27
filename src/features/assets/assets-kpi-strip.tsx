"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Boxes, PackageCheck, PackageMinus, Tags } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssetCatalogKpis } from "./types";

type KpiItem = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "blue" | "emerald" | "amber" | "slate" | "rose";
};

const TONE: Record<
  KpiItem["tone"],
  { wrap: string; icon: string; value: string }
> = {
  blue: {
    wrap: "border-blue-100 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30",
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
    value: "text-blue-900 dark:text-blue-100",
  },
  emerald: {
    wrap: "border-emerald-100 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  amber: {
    wrap: "border-amber-100 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
    value: "text-amber-900 dark:text-amber-100",
  },
  slate: {
    wrap: "border-slate-200 bg-slate-50/80 dark:border-slate-700/80 dark:bg-slate-900/40",
    icon: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    value: "text-slate-900 dark:text-slate-100",
  },
  rose: {
    wrap: "border-rose-100 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/30",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
    value: "text-rose-900 dark:text-rose-100",
  },
};

export function AssetsKpiStrip({
  kpis,
  labels,
}: {
  kpis: AssetCatalogKpis;
  labels: {
    skus: string;
    units: string;
    assigned: string;
    available: string;
    lowStock: string;
  };
}) {
  const items: KpiItem[] = [
    { id: "skus", label: labels.skus, value: kpis.total_skus, icon: Tags, tone: "blue" },
    { id: "units", label: labels.units, value: kpis.total_units, icon: Boxes, tone: "slate" },
    {
      id: "assigned",
      label: labels.assigned,
      value: kpis.assigned_units,
      icon: PackageMinus,
      tone: "amber",
    },
    {
      id: "available",
      label: labels.available,
      value: kpis.available_units,
      icon: PackageCheck,
      tone: "emerald",
    },
    {
      id: "lowStock",
      label: labels.lowStock,
      value: kpis.low_stock_count,
      icon: AlertTriangle,
      tone: "rose",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const tone = TONE[item.tone];
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2.5 py-2 shadow-sm",
              tone.wrap,
            )}
          >
            <span
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                tone.icon,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className={cn("text-lg font-semibold tabular-nums leading-tight", tone.value)}>
                {item.value.toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
