"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SearchSelect } from "@/components/ui/search-select";
import { cn } from "@/lib/utils";
import type { GeofenceKind, GeofenceStatus, ZoneGeofenceSettings } from "./types";

type GeofenceFieldsProps = {
  value: ZoneGeofenceSettings;
  onChange: (next: ZoneGeofenceSettings) => void;
};

export function ZoneGeofenceTypeSection({ value, onChange }: GeofenceFieldsProps) {
  const t = useTranslations("pages.zones");

  return (
    <div className="space-y-2">
      <Label>{t("geofence.kindTitle")}</Label>
      <div className="grid grid-cols-2 gap-2">
        {(["inclusion", "exclusion"] as GeofenceKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onChange({ ...value, geofence_kind: kind })}
            className={cn(
              "cursor-pointer rounded-lg border px-3 py-2 text-start text-xs transition-colors",
              value.geofence_kind === kind
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50",
            )}
          >
            <span className="font-medium">{t(`geofence.kind.${kind}`)}</span>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t(`geofence.kindHint.${kind}`)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ZoneGeofenceStatusSection({ value, onChange }: GeofenceFieldsProps) {
  const t = useTranslations("pages.zones");
  return (
    <div className="space-y-1.5">
      <Label>{t("geofence.status")}</Label>
      <div className="flex flex-wrap gap-1.5">
        {(["active", "inactive", "draft"] as GeofenceStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onChange({ ...value, status })}
            className={cn(
              "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium",
              value.status === status
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {t(`geofence.status.${status}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ZoneAlertSettingsSection({ value, onChange }: GeofenceFieldsProps) {
  const t = useTranslations("pages.zones");
  const dwellMinutes = Math.floor(value.dwell_time_seconds / 60);
  const dwellSeconds = value.dwell_time_seconds % 60;

  const setDwellFromParts = (minutes: number, seconds: number) => {
    onChange({
      ...value,
      dwell_time_seconds: Math.max(0, minutes * 60 + seconds),
    });
  };

  return (
    <div className="space-y-2">
      <Label>{t("geofence.alertsTitle")}</Label>
      {(
        [
          ["alert_on_entry", t("geofence.alertEntry")],
          ["alert_on_exit", t("geofence.alertExit")],
          ["alert_on_dwell", t("geofence.alertDwell")],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <Label htmlFor={key} className="text-sm font-normal">
            {label}
          </Label>
          <Switch
            id={key}
            checked={value[key]}
            onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
          />
        </div>
      ))}
      {value.alert_on_dwell ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={59}
            value={dwellMinutes}
            onChange={(e) =>
              setDwellFromParts(Number(e.target.value) || 0, dwellSeconds)
            }
            className="h-8 w-16 rounded-lg text-xs"
            aria-label={t("geofence.dwellMinutes")}
          />
          <span className="text-xs text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            max={59}
            value={dwellSeconds}
            onChange={(e) =>
              setDwellFromParts(dwellMinutes, Number(e.target.value) || 0)
            }
            className="h-8 w-16 rounded-lg text-xs"
            aria-label={t("geofence.dwellSeconds")}
          />
          <span className="text-xs text-muted-foreground">{t("geofence.dwellLabel")}</span>
        </div>
      ) : null}
    </div>
  );
}

export function ZoneNotificationSettingsSection({ value, onChange }: GeofenceFieldsProps) {
  const t = useTranslations("pages.zones");
  return (
    <div className="space-y-2">
      <Label>{t("geofence.notificationsTitle")}</Label>
      {(
        [
          ["notify_in_app", t("geofence.notifyInApp")],
          ["notify_email", t("geofence.notifyEmail")],
          ["notify_sms", t("geofence.notifySms")],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-2">
          <Label htmlFor={key} className="text-sm font-normal">
            {label}
          </Label>
          <Switch
            id={key}
            checked={value[key]}
            onCheckedChange={(checked) => onChange({ ...value, [key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}

export function ZoneAssignSettingsSection({
  value,
  onChange,
  groupItems,
}: GeofenceFieldsProps & {
  groupItems?: Array<{ value: string; label: string; keywords?: string[] }>;
}) {
  const t = useTranslations("pages.zones");

  return (
    <div className="space-y-2">
      <Label>{t("geofence.assignTitle")}</Label>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="assign_to_all_drivers" className="text-sm font-normal">
          {t("geofence.assignAllDrivers")}
        </Label>
        <Switch
          id="assign_to_all_drivers"
          checked={value.assign_to_all_drivers}
          onCheckedChange={(checked) =>
            onChange({
              ...value,
              assign_to_all_drivers: checked,
              driver_group_label: checked ? null : value.driver_group_label,
            })
          }
        />
      </div>
      {!value.assign_to_all_drivers ? (
        <div className="space-y-1.5">
          <Label htmlFor="driver_group_label">{t("geofence.driverGroupLabel")}</Label>
          {groupItems && groupItems.length > 0 ? (
            <SearchSelect
              items={groupItems}
              value={value.driver_group_label}
              onChange={(next) =>
                onChange({
                  ...value,
                  driver_group_label: next,
                })
              }
              recentsKey="zones-driver-group"
              searchPlaceholder={t("geofence.searchDriverHint")}
              placeholder={t("geofence.driverGroupPlaceholder")}
            />
          ) : (
            <Input
              id="driver_group_label"
              value={value.driver_group_label ?? ""}
              onChange={(e) =>
                onChange({ ...value, driver_group_label: e.target.value })
              }
              className="h-8 rounded-lg text-xs"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ZoneGeofenceFields({
  value,
  onChange,
  groupItems,
}: GeofenceFieldsProps & {
  groupItems?: Array<{ value: string; label: string; keywords?: string[] }>;
}) {
  const t = useTranslations("pages.zones");
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-semibold">{t("geofence.detailsTitle")}</h3>
        <p className="text-[11px] text-muted-foreground">{t("geofence.detailsHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="geofence-description">{t("geofence.description")}</Label>
        <Textarea
          id="geofence-description"
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          rows={2}
          className="rounded-lg text-sm"
        />
      </div>

      <ZoneGeofenceTypeSection value={value} onChange={onChange} />
      <ZoneGeofenceStatusSection value={value} onChange={onChange} />
      <ZoneAlertSettingsSection value={value} onChange={onChange} />
      <ZoneNotificationSettingsSection value={value} onChange={onChange} />
      <ZoneAssignSettingsSection value={value} onChange={onChange} groupItems={groupItems} />
    </div>
  );
}
