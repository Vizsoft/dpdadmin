"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { NOTIFICATION_TARGET_MODES } from "./constants";
import { estimateNotificationAudience } from "./notifications-actions";
import { useNotificationTargetingOptions } from "./use-notifications";
import type { TargetSpec } from "./types";

type Props = {
  targetMode: TargetSpec["mode"];
  zoneIds: string[];
  partnerIds: string[];
  driverIds: string[];
  onTargetModeChange: (mode: TargetSpec["mode"]) => void;
  onZoneIdsChange: (ids: string[]) => void;
  onPartnerIdsChange: (ids: string[]) => void;
  onDriverIdsChange: (ids: string[]) => void;
  showEstimate?: boolean;
};

export function NotificationTargetingFields({
  targetMode,
  zoneIds,
  partnerIds,
  driverIds,
  onTargetModeChange,
  onZoneIdsChange,
  onPartnerIdsChange,
  onDriverIdsChange,
  showEstimate = true,
}: Props) {
  const t = useTranslations("pages.notifications");
  const { data: targeting } = useNotificationTargetingOptions();
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const targetSpec = useMemo<TargetSpec>(() => {
    if (targetMode === "zone") return { mode: "zone", zone_ids: zoneIds };
    if (targetMode === "partner") return { mode: "partner", partner_ids: partnerIds };
    if (targetMode === "custom") return { mode: "custom", driver_ids: driverIds };
    return { mode: targetMode };
  }, [targetMode, zoneIds, partnerIds, driverIds]);

  async function refreshAudience() {
    try {
      const count = await estimateNotificationAudience(targetSpec);
      setAudienceCount(count);
    } catch {
      toast.error(t("errors.audienceEstimateFailed"));
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{t("targetMode")}</Label>
        <Select value={targetMode} onValueChange={(v) => onTargetModeChange(v as TargetSpec["mode"])}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_TARGET_MODES.map((mode) => (
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
