"use client";

import { useTranslations } from "next-intl";
import { Bookmark, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { TrackingStatus } from "@/features/locations/types";
import { TrackingGlassCard, TrackingMetricTile } from "./tracking-shell";
import type { LiveTrackingFilterState } from "./live-tracking-filters";

export function FleetOverviewPanel({
  totalDrivers,
  trackedCount,
  alertsCount,
  filters,
  onChange,
  zoneOptions,
  partnerOptions,
}: {
  totalDrivers: number;
  trackedCount: number;
  alertsCount: number;
  filters: LiveTrackingFilterState;
  onChange: (next: LiveTrackingFilterState) => void;
  zoneOptions: Array<{ id: string; name: string }>;
  partnerOptions: Array<{ id: string; name: string }>;
}) {
  const t = useTranslations("pages.liveTracking");

  const statusChips: Array<{
    id: LiveTrackingFilterState["statusChip"];
    label: string;
  }> = [
    { id: "all", label: t("chipAll") },
    { id: "online", label: t("chipOnline") },
    { id: "on_duty", label: t("chipOnDuty") },
    { id: "idle", label: t("chipIdle") },
    { id: "alert", label: t("chipAlert") },
    { id: "offline", label: t("chipOffline") },
  ];

  return (
    <TrackingGlassCard className="flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border/80 px-3 py-3.5">
        <h2 className="text-sm font-semibold">{t("fleetOverview")}</h2>
        <p className="text-xs text-muted-foreground">{t("fleetOverviewHint")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TrackingMetricTile label={t("metricTotalDrivers")} value={totalDrivers} />
          <TrackingMetricTile
            label={t("metricActiveTracked")}
            value={trackedCount}
            accent="success"
          />
          <TrackingMetricTile
            label={t("metricInProgress")}
            value={trackedCount}
            hint={t("metricInProgressHint")}
          />
          <TrackingMetricTile
            label={t("metricAlerts")}
            value={alertsCount}
            accent={alertsCount > 0 ? "danger" : "default"}
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3.5">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground/80" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="h-9 rounded-lg border-border/80 bg-background/80 ps-8 shadow-xs transition-colors focus-visible:bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t("filterStatusChips")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChange({ ...filters, statusChip: chip.id })}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                  filters.statusChip === chip.id
                    ? "border-primary/60 bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(99,102,241,0.15)]"
                    : "border-border/80 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("filterZone")}</Label>
          <Select
            value={filters.zoneId}
            onValueChange={(zoneId) => onChange({ ...filters, zoneId: zoneId ?? "all" })}
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg border-border/80 bg-background/80 shadow-xs transition-colors hover:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allZones")}</SelectItem>
              {zoneOptions.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("filterPartner")}</Label>
          <Select
            value={filters.partnerId}
            onValueChange={(partnerId) =>
              onChange({ ...filters, partnerId: partnerId ?? "all" })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg border-border/80 bg-background/80 shadow-xs transition-colors hover:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allPartners")}</SelectItem>
              {partnerOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("filterBattery")}</Label>
          <Select
            value={filters.batteryLevel}
            onValueChange={(batteryLevel) =>
              onChange({
                ...filters,
                batteryLevel: (batteryLevel ?? "all") as LiveTrackingFilterState["batteryLevel"],
              })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg border-border/80 bg-background/80 shadow-xs transition-colors hover:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterBatteryAll")}</SelectItem>
              <SelectItem value="low">{t("filterBatteryLow")}</SelectItem>
              <SelectItem value="medium">{t("filterBatteryMedium")}</SelectItem>
              <SelectItem value="high">{t("filterBatteryHigh")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("filterGps")}</Label>
          <Select
            value={filters.gpsSignal}
            onValueChange={(gpsSignal) =>
              onChange({
                ...filters,
                gpsSignal: (gpsSignal ?? "all") as LiveTrackingFilterState["gpsSignal"],
              })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg border-border/80 bg-background/80 shadow-xs transition-colors hover:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterGpsAll")}</SelectItem>
              <SelectItem value="excellent">{t("gpsExcellent")}</SelectItem>
              <SelectItem value="good">{t("gpsGood")}</SelectItem>
              <SelectItem value="weak">{t("gpsWeak")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("filterStatus")}</Label>
          <Select
            value={filters.trackingStatus}
            onValueChange={(trackingStatus) =>
              onChange({
                ...filters,
                trackingStatus: (trackingStatus ??
                  "all") as LiveTrackingFilterState["trackingStatus"],
              })
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg border-border/80 bg-background/80 shadow-xs transition-colors hover:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="idle">{t("statusIdle")}</SelectItem>
              <SelectItem value="moving">{t("statusMoving")}</SelectItem>
              <SelectItem value="delivery_submit">{t("statusDeliverySubmit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="on-duty-only" className="text-sm">
            {t("filterOnDuty")}
          </Label>
          <Switch
            id="on-duty-only"
            checked={filters.onDutyOnly}
            onCheckedChange={(onDutyOnly) => onChange({ ...filters, onDutyOnly })}
          />
        </div>

        <Button type="button" variant="outline" size="sm" className="w-full border-border/80 bg-background/70" disabled>
          <Bookmark className="me-2 h-3.5 w-3.5" />
          {t("saveFilterView")}
        </Button>
      </div>
    </TrackingGlassCard>
  );
}
