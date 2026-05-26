import type { RestaurantGeofenceKind } from "./types";

const INCLUSION_COLOR = "#22c55e";
const EXCLUSION_COLOR = "#ef4444";

export function defaultGeofenceColor(kind: RestaurantGeofenceKind): string {
  return kind === "inclusion" ? INCLUSION_COLOR : EXCLUSION_COLOR;
}
