"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Map as LeafletMap } from "leaflet";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { ZoneColorPicker } from "./zone-color-picker";
import { pickAutoZoneColor, normalizeZoneColor } from "./zone-colors";
import { ZoneMap } from "./zone-map";
import { geomanDrawOptions } from "./zone-map-geoman-options";
import { createZone, updateZone } from "./zones-actions";
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
};

function ZoneFormBody({
  zone,
  existingZones,
  onClose,
  onSaved,
}: {
  zone: ZoneRow | null;
  existingZones: ZoneRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("pages.zones");
  const isEdit = Boolean(zone);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(zone?.name ?? "");
  const [code, setCode] = useState(zone?.code ?? "");

  useEffect(() => {
    if (!zone) setCode(suggestZoneCode());
  }, [zone]);

  const [zoneType, setZoneType] = useState<ZoneGeometryType>(zone?.zone_type ?? "polygon");
  const [color, setColor] = useState(() =>
    normalizeZoneColor(
      zone?.color ?? pickAutoZoneColor(existingZones.map((z) => z.color)),
    ),
  );

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
        <DialogHeader className="border-b border-border px-6 py-4 pr-14">
          <DialogTitle>{isEdit ? t("editZoneTitle") : t("addZoneTitle")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="zone-name">{t("fieldName")}</Label>
              <Input
                id="zone-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fieldNamePlaceholder")}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-code">{t("fieldCode")}</Label>
              <Input
                id="zone-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ZN-1025"
                className="rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("fieldColor")}</Label>
            <ZoneColorPicker value={color} onChange={setColor} />
            <p className="text-xs text-muted-foreground">{t("fieldColorHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("fieldType")}</Label>
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
          </div>

          {zoneType === "circle" && (
            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground">{t("radiusHint")}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("drawOnMap")}</Label>
            <p className="text-xs text-muted-foreground">
              {zoneType === "polygon" ? t("polygonFinishHint") : t("drawHint")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer rounded-lg"
                onClick={startDrawing}
              >
                {zoneType === "polygon" ? t("startDrawPolygon") : t("startDrawCircle")}
              </Button>
              {geometry ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t("geometryReady")}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{t("geometryPending")}</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
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
}: ZoneFormSheetProps) {
  return (
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
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
