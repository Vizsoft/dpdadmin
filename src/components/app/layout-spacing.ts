/**
 * Standard layout spacing — use on command centers, maps, and split-panel views.
 * Do not invent one-off gap/padding values; pick from here.
 */
export const LAYOUT = {
  /** Standard dashboard main content inset (12px) */
  commandPageInset: "p-3",
  /** Gap between sidebar panel and main stage (8px) */
  panelGap: "gap-2",
  /** Vertical stack gap inside panels (8px) */
  stackGap: "gap-2",
  /** Compact padding inside command panel sections (12px) */
  panelSection: "px-3 py-2.5",
  /** Inner filter / form block padding */
  panelBlock: "p-3",
  /**
   * Map stage height — stops ~10% above the viewport fold.
   * 90dvh minus dashboard chrome (header + page padding + title band).
   * REQUIRED whenever widgets/tables/actions render below the map — use via TrackingMapStage.
   */
  mapAboveFoldHeight: "h-[calc(100dvh-9rem)]",
  /** Minimum map stage height when using mapAboveFoldHeight */
  mapAboveFoldMin: "min-h-[480px]",
} as const;
