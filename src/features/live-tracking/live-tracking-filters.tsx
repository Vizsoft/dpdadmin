import type { TrackingStatus } from "@/features/locations/types";
import type { GpsQuality } from "./tracking-metrics";
import { batteryLevelBucket, gpsSignalBucket } from "./tracking-metrics";

export type LiveTrackingFilterState = {
  search: string;
  zoneId: string;
  partnerId: string;
  trackingStatus: TrackingStatus | "all";
  onDutyOnly: boolean;
  statusChip: "all" | "online" | "on_duty" | "idle" | "alert" | "offline";
  batteryLevel: "all" | "low" | "medium" | "high";
  gpsSignal: "all" | GpsQuality;
};

export const DEFAULT_LIVE_TRACKING_FILTERS: LiveTrackingFilterState = {
  search: "",
  zoneId: "all",
  partnerId: "all",
  trackingStatus: "all",
  onDutyOnly: false,
  statusChip: "all",
  batteryLevel: "all",
  gpsSignal: "all",
};

export function matchesLiveTrackingFilters(
  loc: {
    driverName: string;
    driverCode: string;
    isOnDuty: boolean;
    trackingStatus: TrackingStatus;
    pinStatus: "active" | "idle" | "alert";
    batteryPct: number | null;
    accuracyMeters: number | null;
    zoneStatus: import("@/features/locations/types").ZoneStatus | null;
  },
  filters: LiveTrackingFilterState,
  meta?: { zoneId: string | null; partnerId: string | null; zoneName: string | null },
): boolean {
  if (filters.onDutyOnly && !loc.isOnDuty) return false;
  if (filters.trackingStatus !== "all" && loc.trackingStatus !== filters.trackingStatus) {
    return false;
  }
  if (filters.zoneId !== "all" && meta?.zoneId !== filters.zoneId) return false;
  if (filters.partnerId !== "all" && meta?.partnerId !== filters.partnerId) return false;

  if (filters.batteryLevel !== "all") {
    const bucket = batteryLevelBucket(loc.batteryPct);
    if (bucket !== filters.batteryLevel) return false;
  }

  if (filters.gpsSignal !== "all") {
    const bucket = gpsSignalBucket(loc.accuracyMeters);
    if (bucket !== filters.gpsSignal) return false;
  }

  switch (filters.statusChip) {
    case "online":
      if (!loc.isOnDuty) return false;
      break;
    case "on_duty":
      if (!loc.isOnDuty) return false;
      break;
    case "idle":
      if (loc.trackingStatus !== "idle") return false;
      break;
    case "alert":
      if (loc.pinStatus !== "alert") return false;
      break;
    case "offline":
      if (loc.isOnDuty) return false;
      break;
    default:
      break;
  }

  const q = filters.search.trim().toLowerCase();
  if (!q) return true;
  return (
    loc.driverName.toLowerCase().includes(q) ||
    loc.driverCode.toLowerCase().includes(q) ||
    (meta?.zoneName ?? "").toLowerCase().includes(q)
  );
}
