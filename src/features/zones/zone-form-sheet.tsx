"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Layers, List, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  suggestZoneCode,
  type ZoneGeometryType,
  type ZoneGeoFeature,
} from "@/lib/geo/zone-geometry";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { ZoneColorPicker } from "./zone-color-picker";
import {
  isPaletteColor,
  pickAutoZoneColor,
  normalizeZoneColor,
} from "./zone-colors";
import { ZoneMap } from "./zone-map";
import { ZonePlaceSearch } from "./zone-place-search";
import type { ZoneMapAdapter, ZoneMapViewport } from "./zone-map-adapter";
import { DEFAULT_GEOFENCE_SETTINGS } from "./geofence-defaults";
import { ZoneGeofenceFields } from "./zone-geofence-fields";
import { createZone, deleteZone, updateZone } from "./zones-actions";
import { isZoneErrorKey } from "./zone-errors";
import type { ZoneGeofenceSettings, ZoneRow } from "./types";
import { formatZoneArea, zoneAreaSqKm } from "@/lib/geo/zone-area";

function zoneErrorToast(
  t: ReturnType<typeof useTranslations<"pages.zones">>,
  error?: string,
) {
  if (error && isZoneErrorKey(error)) {
    return t(`errors.${error}`);
  }
  return t("errors.save_failed");
}

type ZoneFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ZoneRow | null;
  existingZones?: ZoneRow[];
  onSaved: () => void;
  onDeleted: () => void;
};

function ZoneFormBody({
  zone,
  existingZones,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  zone: ZoneRow | null;
  existingZones: ZoneRow[];
  onClose: () => void;
  onSaved: () => void;
  onRequestDelete: () => void;
}) {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const isEdit = Boolean(zone);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(zone?.name ?? "");
  const [code, setCode] = useState(zone?.code ?? "");

  useEffect(() => {
    if (!zone) setCode(suggestZoneCode());
  }, [zone]);

  const [zoneType, setZoneType] = useState<ZoneGeometryType>(zone?.zone_type ?? "polygon");
  const [color, setColor] = useState(() => {
    const initial = normalizeZoneColor(
      zone?.color ?? pickAutoZoneColor(existingZones.map((z) => z.color)),
    );
    return isPaletteColor(initial)
      ? initial
      : pickAutoZoneColor(existingZones.map((z) => z.color));
  });

  useEffect(() => {
    if (!zone) {
      setColor(pickAutoZoneColor(existingZones.map((z) => z.color)));
    }
  }, [zone, existingZones]);
  const [geofence, setGeofence] = useState<ZoneGeofenceSettings>(() =>
    zone
      ? {
          geofence_kind: zone.geofence_kind,
          status: zone.status,
          description: zone.description,
          alert_on_entry: zone.alert_on_entry,
          alert_on_exit: zone.alert_on_exit,
          alert_on_dwell: zone.alert_on_dwell,
          dwell_time_seconds: zone.dwell_time_seconds,
          assign_to_all_drivers: zone.assign_to_all_drivers,
          driver_group_label: zone.driver_group_label,
          notify_in_app: zone.notify_in_app,
          notify_email: zone.notify_email,
          notify_sms: zone.notify_sms,
        }
      : { ...DEFAULT_GEOFENCE_SETTINGS },
  );
  const [geometry, setGeometry] = useState<ZoneGeoFeature | null>(zone?.geometry ?? null);
  const [radiusInput, setRadiusInput] = useState(
    zone?.zone_type === "circle" && zone.geometry?.properties?.radiusMeters
      ? String(zone.geometry.properties.radiusMeters)
      : "1000",
  );
  const mapAdapterRef = useRef<ZoneMapAdapter | null>(null);

  const handleMapReady = useCallback((adapter: ZoneMapAdapter) => {
    mapAdapterRef.current = adapter;
    adapter.invalidateSize?.();
  }, []);

  const handlePlaceSelect = useCallback(
    (place: { lat: number; lng: number; viewport?: ZoneMapViewport }) => {
      const adapter = mapAdapterRef.current;
      if (!adapter) return;
      if (place.viewport) {
        adapter.fitViewport(place.viewport);
      } else {
        adapter.panTo(place.lat, place.lng, 14);
      }
    },
    [],
  );

  const startDrawing = () => {
    setGeometry(null);
  };

  const handleGeometryChange = (geo: ZoneGeoFeature | null, type: ZoneGeometryType) => {
    setGeometry(geo);
    setZoneType(type);
    if (geo && type === "circle" && geo.properties?.radiusMeters) {
      setRadiusInput(String(Math.round(geo.properties.radiusMeters)));
    }
  };

  const handleSave = () => {
    if (!geometry) {
      toast.error(t("errors.geometry_required"));
      return;
    }

    startTransition(async () => {
      const payload = {
        name,
        code,
        color,
        zone_type: zoneType,
        geometry,
        geofence,
      };

      const result = isEdit && zone
        ? await updateZone({ id: zone.id, ...payload })
        : await createZone(payload);

      if (result.error) {
        toast.error(zoneErrorToast(t, result.error));
        return;
      }

      toast.success(isEdit ? t("updated") : t("created"));
      onClose();
      onSaved();
    });
  };

  const recentZones = [...existingZones]
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  const summary = {
    total: existingZones.length + (isEdit ? 0 : 1),
    inclusion:
      existingZones.filter((item) => item.geofence_kind === "inclusion").length +
      (isEdit
        ? 0
        : geofence.geofence_kind === "inclusion"
          ? 1
          : 0),
    exclusion:
      existingZones.filter((item) => item.geofence_kind === "exclusion").length +
      (isEdit
        ? 0
        : geofence.geofence_kind === "exclusion"
          ? 1
          : 0),
    activeAlerts:
      existingZones.filter(
        (item) =>
          item.status === "active" &&
          (item.alert_on_entry || item.alert_on_exit || item.alert_on_dwell),
      ).length +
      (isEdit
        ? 0
        : geofence.status === "active" &&
            (geofence.alert_on_entry ||
              geofence.alert_on_exit ||
              geofence.alert_on_dwell)
          ? 1
          : 0),
  };

  const draftArea = geometry ? formatZoneArea(zoneAreaSqKm(zoneType, geometry)) : "—";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Map on top for mobile, right column on desktop */}
      <div className="zones-draw-map-wrapper zones-draw-map-wrapper--modal relative order-1 min-h-[40vh] flex-1 border-b border-border lg:order-2 lg:min-h-0 lg:border-b-0 lg:border-l">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
          <span className="pointer-events-auto rounded-full border border-border/70 bg-background/95 px-3 py-1 text-xs shadow-sm backdrop-blur">
            {t("geofence.drawHint")}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3">
          <ZonePlaceSearch
            onSelect={handlePlaceSelect}
            className="pointer-events-auto mt-11 w-full max-w-sm"
          />
        </div>
        <div className="pointer-events-none absolute end-3 top-3 z-20">
          <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1 text-xs shadow-sm backdrop-blur">
            <button type="button" className="cursor-pointer rounded-full px-2 py-1 text-primary">
              {t("layers.roadmap")}
            </button>
            <button type="button" className="cursor-pointer rounded-full px-2 py-1 text-muted-foreground hover:bg-muted/60">
              {t("layers.satellite")}
            </button>
            <button type="button" className="cursor-pointer rounded-full px-2 py-1 text-muted-foreground hover:bg-muted/60">
              {t("layers.hybrid")}
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 start-3 z-20">
          <div className="pointer-events-auto rounded-xl border border-border/70 bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold text-foreground">
              {name.trim() || t("geofence.unnamed")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("geofence.colArea")}: {draftArea}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute end-3 bottom-3 z-20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-auto h-8 cursor-pointer rounded-lg"
            onClick={onClose}
          >
            <List className="me-1 h-3.5 w-3.5" />
            {t("geofence.listButton")}
          </Button>
        </div>
        <ZoneMap
          zones={existingZones}
          selectedId={null}
          excludeZoneId={zone?.id ?? null}
          drawMode={zoneType}
          draftColor={color}
          draftGeometry={geometry}
          draftZoneType={zoneType}
          onDraftGeometryChange={handleGeometryChange}
          onMapReady={handleMapReady}
          className="zones-google-map h-full w-full"
        />
      </div>

      <div className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-1 lg:w-[420px] lg:min-w-[380px]">
        <DialogHeader className="border-b border-border px-6 py-4 pr-14">
          <DialogTitle className="text-lg">{isEdit ? t("editZoneTitle") : t("addZoneTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("editZoneTitle") : t("addZoneTitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p className="text-xs font-semibold text-foreground">{t("geofence.detailsTitle")}</p>
            <p className="text-[11px] text-muted-foreground">{t("geofence.detailsHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zone-name">{t("fieldName")}</Label>
            <Input
              id="zone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fieldNamePlaceholder")}
              className="rounded-lg"
            />
            <p className="text-[11px] text-muted-foreground">{t("nameHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zone-code">{t("fieldCode")}</Label>
            <Input
              id="zone-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ZN-1025"
              className="rounded-lg font-mono"
            />
            <p className="text-[11px] text-muted-foreground">{t("codeHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("fieldColor")}</Label>
            <ZoneColorPicker value={color} onChange={setColor} />
            <p className="text-[11px] text-muted-foreground">{t("colorHelp")}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>{t("fieldType")}</Label>
              <button
                type="button"
                className="cursor-pointer text-xs font-medium text-primary hover:underline"
                onClick={startDrawing}
              >
                {zoneType === "polygon" ? t("startDrawPolygon") : t("startDrawCircle")}
              </button>
            </div>
            <div className="flex gap-2">
              {(["polygon", "circle"] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={zoneType === type ? "default" : "outline"}
                  className="flex-1 cursor-pointer rounded-lg"
                  onClick={() => {
                    setZoneType(type);
                    setGeometry(null);
                  }}
                >
                  {type === "polygon" ? t("typePolygon") : t("typeCircle")}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {zoneType === "polygon" ? t("polygonTypeHint") : t("circleTypeHint")}
            </p>
          </div>

          {zoneType === "circle" && (
            <div className="space-y-1.5">
              <Label htmlFor="zone-radius">{t("fieldRadius")}</Label>
              <Input
                id="zone-radius"
                type="number"
                min={MIN_RADIUS_METERS}
                max={MAX_RADIUS_METERS}
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                className="rounded-lg"
              />
            </div>
          )}

          <div
            className={
              geometry
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
            }
          >
            {geometry ? t("geometryReady") : t("geometryPending")}
          </div>

          <ZoneGeofenceFields value={geofence} onChange={setGeofence} />

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("tipsTitle")}
            </p>
            <ul className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
              <li className="flex gap-1.5">
                <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{t("tipDraw")}</span>
              </li>
              <li className="flex gap-1.5">
                <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{t("tipFinish")}</span>
              </li>
              <li className="flex gap-1.5">
                <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{t("tipEdit")}</span>
              </li>
              <li className="flex gap-1.5">
                <span aria-hidden className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span>{t("tipClear")}</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
          {isEdit && canManage ? (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRequestDelete}
              disabled={isPending}
            >
              <Trash2 className="me-2 h-3.5 w-3.5" />
              {t("deleteZone")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg"
              onClick={onClose}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="cursor-pointer rounded-lg"
              onClick={handleSave}
              disabled={isPending || !name.trim() || !code.trim() || !geometry}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                t("saveChanges")
              ) : (
                t("createZone")
              )}
            </Button>
          </div>
        </DialogFooter>

      </div>
      </div>

      <div className="grid gap-3 border-t border-border bg-muted/20 px-4 py-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("geofence.summaryDockTitle")}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p className="text-muted-foreground">{t("geofence.summaryTotal")}</p>
              <p className="text-base font-semibold">{summary.total}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p className="text-muted-foreground">{t("geofence.summaryInclusion")}</p>
              <p className="text-base font-semibold">{summary.inclusion}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p className="text-muted-foreground">{t("geofence.summaryExclusion")}</p>
              <p className="text-base font-semibold">{summary.exclusion}</p>
            </div>
            <div className="rounded-lg bg-muted/40 px-2 py-1.5">
              <p className="text-muted-foreground">{t("geofence.summaryAlerts")}</p>
              <p className="text-base font-semibold">{summary.activeAlerts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-sm">
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            {t("geofence.recentTitle")}
          </p>
          <div className="space-y-1.5">
            {recentZones.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("emptyTitle")}</p>
            ) : (
              recentZones.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border/70 px-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-foreground">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">#{item.code}</span>
                  </span>
                  <Badge
                    variant={item.geofence_kind === "exclusion" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {t(`geofence.kind.${item.geofence_kind}`)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ZoneFormSheet({
  open,
  onOpenChange,
  zone,
  existingZones = [],
  onSaved,
  onDeleted,
}: ZoneFormSheetProps) {
  const t = useTranslations("pages.zones");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const runDelete = async () => {
    if (!zone) return;
    const force = zone.driver_count > 0;
    const result = await deleteZone(zone.id, force);
    if (result.error) {
      toast.error(zoneErrorToast(t, result.error));
      throw new Error(result.error);
    }
    toast.success(t("deleted"));
    onOpenChange(false);
    onDeleted();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 p-0"
          showCloseButton
        >
          {open ? (
            <ZoneFormBody
              key={zone?.id ?? "new"}
              zone={zone ?? null}
              existingZones={existingZones}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
              onRequestDelete={() => setDeleteOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {zone ? (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemTitle={t("deleteZone")}
          itemName={zone.name}
          confirmText={zone.code}
          warning={
            zone.driver_count > 0
              ? t("deleteConfirmWithDrivers", { count: zone.driver_count })
              : undefined
          }
          onConfirm={runDelete}
        />
      ) : null}
    </>
  );
}
