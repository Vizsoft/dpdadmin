"use client";

import { cn } from "@/lib/utils";
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
  { dot: string; pill: string; labelKey?: string }
> = {
  available: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  delivering: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  idle: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  break: {
    dot: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  offline: {
    dot: "bg-slate-400",
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
  alert: {
    dot: "bg-rose-500",
    pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  cluster: {
    dot: "bg-indigo-500",
    pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
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
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        style.dot,
        pulse && status === "alert" && "animate-pulse",
        className,
      )}
      aria-hidden
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        style.pill,
        className,
      )}
    >
      <TrackingStatusDot status={status} />
      {label}
    </span>
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
