"use client";

import {
  Activity,
  Check,
  HardHat,
  Navigation,
  Phone,
  Shirt,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSET_TYPES, type DriverAssetType, type DriverWorkflowStatus } from "../types";
import { SectionHeading } from "./driver-form-primitives";

const STATUS_OPTIONS: Array<{
  id: "active" | "inactive";
  key: "active" | "inactive";
  workflow: DriverWorkflowStatus;
}> = [
  { id: "active", key: "active", workflow: "approved" },
  { id: "inactive", key: "inactive", workflow: "draft" },
];

const ASSET_ICONS: Record<DriverAssetType, typeof Navigation> = {
  gps: Navigation,
  sim: Smartphone,
  phone: Phone,
  delivery_bag: ShoppingBag,
  helmet: HardHat,
  uniform: Shirt,
};

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
    <section className="flex h-full flex-col space-y-3 rounded-lg border border-border bg-card p-4">
      <SectionHeading icon={Activity} accent="amber">
        {labels.section}
      </SectionHeading>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">{labels.status}</p>
        <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
          {STATUS_OPTIONS.map((option) => {
            const checked = option.id === activeStatus;
            const isActive = option.key === "active";
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onWorkflowStatusChange(option.workflow)}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors",
                  checked && isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : checked
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {checked && isActive ? <Check className="h-3 w-3" /> : null}
                {option.key === "active" ? labels.active : labels.inactive}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">{labels.assets}</p>
        <div className="flex flex-wrap gap-1.5">
          {ASSET_TYPES.map((asset) => {
            const selected = Boolean(assets[asset]);
            const Icon = ASSET_ICONS[asset];
            return (
              <button
                key={asset}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onToggleAsset(asset)}
                className={cn(
                  "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors",
                  selected
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {assetLabels[asset]}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
