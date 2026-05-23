"use client";

import type { LucideIcon } from "lucide-react";
import {
  Clock3,
  ShieldAlert,
  UserCheck,
  Users,
  UserX,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

type KpiItem = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "blue" | "emerald" | "amber" | "slate" | "rose" | "indigo";
};

const TONE: Record<
  KpiItem["tone"],
  { wrap: string; icon: string; value: string }
> = {
  blue: {
    wrap: "border-blue-100 bg-blue-50/80",
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-900",
  },
  emerald: {
    wrap: "border-emerald-100 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-900",
  },
  amber: {
    wrap: "border-amber-100 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-900",
  },
  slate: {
    wrap: "border-slate-200 bg-slate-50/80",
    icon: "bg-slate-100 text-slate-600",
    value: "text-slate-900",
  },
  rose: {
    wrap: "border-rose-100 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-600",
    value: "text-rose-900",
  },
  indigo: {
    wrap: "border-indigo-100 bg-indigo-50/80",
    icon: "bg-indigo-100 text-indigo-600",
    value: "text-indigo-900",
  },
};

export function DriversKpiStrip({
  total,
  activeToday,
  onlineNow,
  inactive,
  pendingVerification,
  suspended,
  labels,
}: {
  total: number;
  activeToday: number;
  onlineNow: number;
  inactive: number;
  pendingVerification: number;
  suspended: number;
  labels: {
    total: string;
    activeToday: string;
    onlineNow: string;
    inactive: string;
    pending: string;
    suspended: string;
  };
}) {
  const items: KpiItem[] = [
    { id: "total", label: labels.total, value: total, icon: Users, tone: "blue" },
    {
      id: "active",
      label: labels.activeToday,
      value: activeToday,
      icon: UserCheck,
      tone: "emerald",
    },
    {
      id: "online",
      label: labels.onlineNow,
      value: onlineNow,
      icon: Wifi,
      tone: "indigo",
    },
    {
      id: "inactive",
      label: labels.inactive,
      value: inactive,
      icon: UserX,
      tone: "slate",
    },
    {
      id: "pending",
      label: labels.pending,
      value: pendingVerification,
      icon: Clock3,
      tone: "amber",
    },
    {
      id: "suspended",
      label: labels.suspended,
      value: suspended,
      icon: ShieldAlert,
      tone: "rose",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
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
