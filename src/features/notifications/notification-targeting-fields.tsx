"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { NOTIFICATION_SUPPORTED_TARGET_MODES } from "./constants";
import { RequiredLabel } from "./notification-form-primitives";
import { estimateNotificationAudience } from "./notifications-actions";
import { useNotificationTargetingOptions } from "./use-notifications";
import type { TargetSpec } from "./types";

const DRIVER_STATUSES = ["active", "onboarding", "suspended", "inactive"] as const;

type Props = {
  targetMode: TargetSpec["mode"];
  zoneIds: string[];
  partnerIds: string[];
  driverIds: string[];
  statuses: string[];
  onTargetModeChange: (mode: TargetSpec["mode"]) => void;
  onZoneIdsChange: (ids: string[]) => void;
  onPartnerIdsChange: (ids: string[]) => void;
  onDriverIdsChange: (ids: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  showEstimate?: boolean;
  onAudienceCountChange?: (count: number | null) => void;
};

export function NotificationTargetingFields({
  targetMode,
  zoneIds,
  partnerIds,
  driverIds,
  statuses,
  onTargetModeChange,
  onZoneIdsChange,
  onPartnerIdsChange,
  onDriverIdsChange,
  onStatusesChange,
  showEstimate = true,
  onAudienceCountChange,
}: Props) {
  const t = useTranslations("pages.notifications");
  const { data: targeting } = useNotificationTargetingOptions();
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const targetSpec = useMemo<TargetSpec>(() => {
    if (targetMode === "zone") return { mode: "zone", zone_ids: zoneIds };
    if (targetMode === "partner") return { mode: "partner", partner_ids: partnerIds };
    if (targetMode === "custom") return { mode: "custom", driver_ids: driverIds };
    if (targetMode === "status") return { mode: "status", statuses };
    return { mode: targetMode };
  }, [targetMode, zoneIds, partnerIds, driverIds, statuses]);

  async function refreshAudience() {
    try {
      const count = await estimateNotificationAudience(targetSpec);
      setAudienceCount(count);
      onAudienceCountChange?.(count);
    } catch {
      toast.error(t("errors.audienceEstimateFailed"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <RequiredLabel required>{t("targetMode")}</RequiredLabel>
        <Select value={targetMode} onValueChange={(v) => onTargetModeChange(v as TargetSpec["mode"])}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_SUPPORTED_TARGET_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {t(`targetModes.${mode}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {targetMode === "zone" ? (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {(targeting?.zones ?? []).map((z) => (
            <label key={z.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={zoneIds.includes(z.id)}
                onCheckedChange={(checked) =>
                  onZoneIdsChange(checked ? [...zoneIds, z.id] : zoneIds.filter((id) => id !== z.id))
                }
              />
              {z.name}
            </label>
          ))}
        </div>
      ) : null}
      {targetMode === "partner" ? (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {(targeting?.partners ?? []).map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={partnerIds.includes(p.id)}
                onCheckedChange={(checked) =>
                  onPartnerIdsChange(
                    checked ? [...partnerIds, p.id] : partnerIds.filter((id) => id !== p.id),
                  )
                }
              />
              {p.name}
            </label>
          ))}
        </div>
      ) : null}
      {targetMode === "status" ? (
        <div className="space-y-2 rounded-lg border border-border p-3">
          {DRIVER_STATUSES.map((status) => (
            <label key={status} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={statuses.includes(status)}
                onCheckedChange={(checked) =>
                  onStatusesChange(
                    checked ? [...statuses, status] : statuses.filter((s) => s !== status),
                  )
                }
              />
              {t(`driverStatuses.${status}`)}
            </label>
          ))}
        </div>
      ) : null}
      {targetMode === "custom" ? (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
          {(targeting?.drivers ?? []).map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={driverIds.includes(d.id)}
                onCheckedChange={(checked) =>
                  onDriverIdsChange(
                    checked ? [...driverIds, d.id] : driverIds.filter((id) => id !== d.id),
                  )
                }
              />
              {d.label}
            </label>
          ))}
        </div>
      ) : null}
      {showEstimate ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
          <p className="text-sm text-muted-foreground">
            {audienceCount == null
              ? t("audienceEstimateHint")
              : t("audienceEstimate", { count: audienceCount })}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer"
            onClick={() => void refreshAudience()}
          >
            {t("estimateAudience")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
