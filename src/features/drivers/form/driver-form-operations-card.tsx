"use client";

import { cn } from "@/lib/utils";
import { ASSET_TYPES, type DriverAssetType, type DriverWorkflowStatus } from "../types";
import { SectionLabel } from "./driver-form-primitives";

const STATUS_OPTIONS: Array<{
  id: "active" | "inactive";
  key: "active" | "inactive";
  workflow: DriverWorkflowStatus;
}> = [
  { id: "active", key: "active", workflow: "approved" },
  { id: "inactive", key: "inactive", workflow: "draft" },
];

export function DriverFormOperationsCard({
  workflowStatus,
  onWorkflowStatusChange,
  assets,
  onToggleAsset,
  assetLabels,
  labels,
  disabled,
}: {
  workflowStatus: DriverWorkflowStatus;
  onWorkflowStatusChange: (status: DriverWorkflowStatus) => void;
  assets: Record<DriverAssetType, boolean>;
  onToggleAsset: (asset: DriverAssetType) => void;
  assetLabels: Record<DriverAssetType, string>;
  labels: {
    section: string;
    status: string;
    assets: string;
    active: string;
    inactive: string;
  };
  disabled?: boolean;
}) {
  const activeStatus = workflowStatus === "approved" ? "active" : "inactive";

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <SectionLabel>{labels.section}</SectionLabel>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{labels.status}</p>
        <div role="radiogroup" className="grid grid-cols-2 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const checked = option.id === activeStatus;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onWorkflowStatusChange(option.workflow)}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                  checked
                    ? "border-emerald-400/50 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {option.key === "active" ? labels.active : labels.inactive}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{labels.assets}</p>
        <div className="flex flex-wrap gap-2">
          {ASSET_TYPES.map((asset) => {
            const selected = Boolean(assets[asset]);
            return (
              <button
                key={asset}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onToggleAsset(asset)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3 text-sm transition-colors",
                  selected
                    ? "border-emerald-300/70 bg-emerald-50 text-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {assetLabels[asset]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

