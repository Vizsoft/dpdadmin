export const TRACKING_MAP_PREFS_STORAGE_KEY = "dpd:live-tracking:map-prefs";

export type TrackingMapLayerPrefs = {
  mapTypeId: "roadmap" | "satellite" | "hybrid";
  hideLabels: boolean;
};

export const DEFAULT_TRACKING_MAP_PREFS: TrackingMapLayerPrefs = {
  mapTypeId: "roadmap",
  hideLabels: true,
};

export function loadTrackingMapPrefs(): TrackingMapLayerPrefs {
  if (typeof window === "undefined") return DEFAULT_TRACKING_MAP_PREFS;
  try {
    const raw = localStorage.getItem(TRACKING_MAP_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_TRACKING_MAP_PREFS;
    const parsed = JSON.parse(raw) as Partial<TrackingMapLayerPrefs>;
    return {
      mapTypeId:
        parsed.mapTypeId === "satellite" || parsed.mapTypeId === "hybrid"
          ? parsed.mapTypeId
          : "roadmap",
      hideLabels: parsed.hideLabels ?? DEFAULT_TRACKING_MAP_PREFS.hideLabels,
    };
  } catch {
    return DEFAULT_TRACKING_MAP_PREFS;
  }
}

export function saveTrackingMapPrefs(prefs: TrackingMapLayerPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRACKING_MAP_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore localStorage errors
  }
}
