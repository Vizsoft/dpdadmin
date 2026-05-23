"use client";

import { Layers2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TrackingMapLayerPrefs } from "./tracking-map-layer-prefs";

export function TrackingMapLayersPopover({
  prefs,
  onChange,
  trafficEnabled,
  onToggleTraffic,
  className,
}: {
  prefs: TrackingMapLayerPrefs;
  onChange: (next: TrackingMapLayerPrefs) => void;
  trafficEnabled: boolean;
  onToggleTraffic: (enabled: boolean) => void;
  className?: string;
}) {
  const t = useTranslations("pages.liveTracking");

  const mapTypes: Array<{ id: TrackingMapLayerPrefs["mapTypeId"]; label: string }> = [
    { id: "roadmap", label: t("mapTypeRoadmap") },
    { id: "satellite", label: t("mapTypeSatellite") },
    { id: "hybrid", label: t("mapTypeHybrid") },
  ];

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card/95 text-foreground shadow-sm transition-colors hover:bg-accent",
          className,
        )}
        title={t("layers")}
      >
        <Layers2 className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4 p-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("mapType")}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {mapTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  prefs.mapTypeId === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-foreground hover:bg-muted",
                )}
                onClick={() => onChange({ ...prefs, mapTypeId: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-foreground">{t("mapLayerTraffic")}</p>
            <Switch
              checked={trafficEnabled}
              onCheckedChange={onToggleTraffic}
              aria-label={t("mapLayerTraffic")}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-foreground">{t("hideMapLabels")}</p>
            <Switch
              checked={prefs.hideLabels}
              onCheckedChange={(checked) => onChange({ ...prefs, hideLabels: checked })}
              aria-label={t("hideMapLabels")}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
