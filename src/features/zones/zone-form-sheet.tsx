"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
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
import { geomanDrawOptions } from "./zone-map-geoman-options";
import { createZone, deleteZone, updateZone } from "./zones-actions";
import { isZoneErrorKey } from "./zone-errors";
import type { ZoneRow } from "./types";

function zoneErrorToast(
  t: ReturnType<typeof useTranslations<"pages.zones">>,
  error?: string,
) {
  if (error && isZoneErrorKey(error)) {
    return t(`errors.${error}`);
  }
  return t("errors.save_failed");
}

function invalidateMapSize(map: LeafletMap | null) {
  if (!map) return;
  map.invalidateSize({ animate: false });
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
  onDeleted,
  onRequestDelete,
}: {
  zone: ZoneRow | null;
  existingZones: ZoneRow[];
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
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
  const [geometry, setGeometry] = useState<ZoneGeoFeature | null>(zone?.geometry ?? null);
  const [radiusInput, setRadiusInput] = useState(
    zone?.zone_type === "circle" && zone.geometry?.properties?.radiusMeters
      ? String(zone.geometry.properties.radiusMeters)
      : "1000",
  );
  const mapRef = useRef<LeafletMap | null>(null);

  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
    invalidateMapSize(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    invalidateMapSize(map);
    const t1 = window.setTimeout(() => invalidateMapSize(map), 100);
    const t2 = window.setTimeout(() => invalidateMapSize(map), 400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const startDrawing = () => {
    const map = mapRef.current;
    if (!map?.pm) return;
    setGeometry(null);
    map.invalidateSize({ animate: false });
    try {
      map.pm.disableGlobalEditMode();
      map.pm.disableGlobalRemovalMode();
      map.pm.disableDraw();
      const opts = geomanDrawOptions(zoneType === "polygon" ? "polygon" : "circle");
      map.pm.enableDraw(opts.shape, opts.options);
    } catch {
      /* ignore */
    }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Map on top for mobile, right column on desktop */}
      <div className="zones-draw-map-wrapper zones-draw-map-wrapper--modal order-1 min-h-[45vh] flex-1 border-b border-border lg:order-2 lg:min-h-0 lg:flex-[1.4] lg:border-b-0 lg:border-l">
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
          className="zones-leaflet-map h-full w-full"
        />
      </div>

      <div className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-1 lg:w-[min(400px,38%)] lg:max-w-[420px]">
        <DialogHeader className="border-b border-border px-6 py-3 pr-14">
          <DialogTitle>{isEdit ? t("editZoneTitle") : t("addZoneTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
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
          className="flex h-[90vh] max-h-[90vh] flex-col gap-0"
          showCloseButton
        >
          {open ? (
            <ZoneFormBody
              key={zone?.id ?? "new"}
              zone={zone ?? null}
              existingZones={existingZones}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
              onDeleted={onDeleted}
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
