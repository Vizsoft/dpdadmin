"use client";

import { useTranslations } from "next-intl";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatBatteryPct,
  formatSpeedMps,
} from "@/features/locations/location-status";
import type { DriverLiveLocation, PinStatus, TrackingStatus } from "@/features/locations/types";

function pinVariant(status: PinStatus): "success" | "warning" | "danger" {
  if (status === "active") return "success";
  if (status === "idle") return "warning";
  return "danger";
}

function trackingLabel(
  t: ReturnType<typeof useTranslations<"pages.liveTracking">>,
  status: TrackingStatus,
) {
  if (status === "moving") return t("statusMoving");
  if (status === "delivery_submit") return t("statusDeliverySubmit");
  return t("statusIdle");
}

export function LiveDriverList({
  drivers,
  selectedId,
  onSelect,
}: {
  drivers: DriverLiveLocation[];
  selectedId: string | null;
  onSelect: (driverId: string) => void;
}) {
  const t = useTranslations("pages.liveTracking");

  if (drivers.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        {t("noDrivers")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/70 overflow-y-auto">
      {drivers.map((loc) => (
        <li key={loc.driverId}>
          <button
            type="button"
            onClick={() => onSelect(loc.driverId)}
            className={cn(
              "flex w-full cursor-pointer flex-col gap-2.5 px-4 py-3 text-start transition-all hover:bg-muted/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selectedId === loc.driverId &&
                "bg-primary/[0.08] shadow-[inset_2px_0_0_0_var(--color-primary)]",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{loc.driverName}</p>
                <p className="font-mono text-xs text-muted-foreground">#{loc.driverCode}</p>
                {loc.restaurantName ? (
                  <p className="truncate text-xs text-muted-foreground">{loc.restaurantName}</p>
                ) : null}
              </div>
              <StatusPill variant={pinVariant(loc.pinStatus)} dot>
                {trackingLabel(t, loc.trackingStatus)}
              </StatusPill>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatSpeedMps(loc.speedMps)}</span>
              <span>{formatBatteryPct(loc.batteryPct)}</span>
              <span>
                ±{loc.accuracyMeters != null ? loc.accuracyMeters.toFixed(0) : "—"} m
              </span>
              {loc.zoneStatus ? (
                <Badge
                  variant={loc.zoneStatus === "out_of_zone" ? "destructive" : "secondary"}
                  className="text-[10px]"
                >
                  {t(`zoneStatus.${loc.zoneStatus}`)}
                </Badge>
              ) : null}
            </div>

            <p className="text-[10px] text-muted-foreground">
              {t("colLastSeen")}:{" "}
              {new Date(loc.lastSeenAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
