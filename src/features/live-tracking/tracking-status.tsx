"use client";

import { cn } from "@/lib/utils";
import { Pill, StatusDot, type Tone } from "@/components/ui/metric-tile";
import type { PinStatus, TrackingStatus } from "@/features/locations/types";

export type FleetStatusKey =
  | "available"
  | "delivering"
  | "idle"
  | "break"
  | "offline"
  | "alert"
  | "cluster";

const STATUS_STYLES: Record<
  FleetStatusKey,
  { dot: string; pill: string; tone: Tone; labelKey?: string }
> = {
  available: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    tone: "emerald",
  },
  delivering: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    tone: "blue",
  },
  idle: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
    tone: "amber",
  },
  break: {
    dot: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    tone: "indigo",
  },
  offline: {
    dot: "bg-slate-400",
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    tone: "slate",
  },
  alert: {
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    tone: "rose",
  },
  cluster: {
    dot: "bg-indigo-500",
    pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    tone: "indigo",
  },
};

export function fleetStatusFromLocation(input: {
  pinStatus: PinStatus;
  trackingStatus: TrackingStatus;
  isOnDuty: boolean;
}): FleetStatusKey {
  if (input.pinStatus === "alert") return "alert";
  if (!input.isOnDuty) return "offline";
  if (input.trackingStatus === "delivery_submit") return "delivering";
  if (input.trackingStatus === "moving") return "available";
  if (input.trackingStatus === "idle") return "idle";
  return "available";
}

export function TrackingStatusDot({
  status,
  className,
  pulse,
}: {
  status: FleetStatusKey;
  className?: string;
  pulse?: boolean;
}) {
  const style = STATUS_STYLES[status];
  return (
    <StatusDot
      tone={style.tone}
      className={cn(pulse && status === "alert" && "animate-pulse", className)}
    />
  );
}

export function TrackingStatusPill({
  status,
  label,
  className,
}: {
  status: FleetStatusKey;
  label: string;
  className?: string;
}) {
  const style = STATUS_STYLES[status];
  return (
    <Pill tone={style.tone} className={cn(style.pill, className)}>
      <TrackingStatusDot status={status} />
      {label}
    </Pill>
  );
}

export const LEGEND_STATUSES: FleetStatusKey[] = [
  "available",
  "delivering",
  "idle",
  "break",
  "offline",
  "alert",
  "cluster",
];

export const LEGEND_FILTERABLE_STATUSES: FleetStatusKey[] = [
  "available",
  "delivering",
  "idle",
  "break",
  "offline",
  "alert",
];
