/**
 * Standard layout spacing — use on command centers, maps, and split-panel views.
 * Do not invent one-off gap/padding values; pick from here.
 */
export const LAYOUT = {
  /** Effective page inset when parent main uses p-6 (24px → 12px) */
  commandPageInsetNegate: "-m-3",
  /** Standalone page inset for full-bleed command views */
  commandPageInset: "p-3",
  /** Gap between sidebar panel and main stage (8px) */
  panelGap: "gap-2",
  /** Vertical stack gap inside panels (8px) */
  stackGap: "gap-2",
  /** Compact padding inside command panel sections (12px) */
  panelSection: "px-3 py-2.5",
  /** Inner filter / form block padding */
  panelBlock: "p-3",
} as const;
