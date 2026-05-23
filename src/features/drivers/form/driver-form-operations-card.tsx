"use client";

import {
  Activity,
  HardHat,
  Navigation,
  Phone,
  Shirt,
  ShoppingBag,
  Smartphone,
} from "lucide-react";
import { SegmentOption, ToggleChip } from "@/components/app/toggle-chip";
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

const ASSET_ICON_MAP: Record<DriverAssetType, typeof Navigation> = {
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
            return (
              <SegmentOption
                key={option.id}
                selected={checked}
                disabled={disabled}
                variant={option.key === "active" ? "success" : "default"}
                onClick={() => onWorkflowStatusChange(option.workflow)}
              >
                {option.key === "active" ? labels.active : labels.inactive}
              </SegmentOption>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">{labels.assets}</p>
        <div className="flex flex-wrap gap-1.5">
          {ASSET_TYPES.map((asset) => {
            const Icon = ASSET_ICON_MAP[asset];
            return (
              <ToggleChip
                key={asset}
                selected={Boolean(assets[asset])}
                disabled={disabled}
                icon={Icon}
                onClick={() => onToggleAsset(asset)}
              >
                {assetLabels[asset]}
              </ToggleChip>
            );
          })}
        </div>
      </div>
    </section>
  );
}
