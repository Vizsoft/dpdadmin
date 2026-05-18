"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
  suggestZoneCode,
  type ZoneGeometryType,
  type ZoneGeoFeature,
} from "@/lib/geo/zone-geometry";
import { ZoneMap } from "./zone-map";
import { createZone, updateZone } from "./zones-actions";
import type { ZoneRow } from "./types";

type ZoneFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: ZoneRow | null;
  onSaved: () => void;
};

function ZoneFormBody({
  zone,
  onClose,
  onSaved,
}: {
  zone: ZoneRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("pages.zones");
  const isEdit = Boolean(zone);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(zone?.name ?? "");
  const [code, setCode] = useState(zone?.code ?? suggestZoneCode());
  const [zoneType, setZoneType] = useState<ZoneGeometryType>(zone?.zone_type ?? "polygon");
  const [geometry, setGeometry] = useState<ZoneGeoFeature | null>(zone?.geometry ?? null);
  const [radiusInput, setRadiusInput] = useState(
    zone?.zone_type === "circle" && zone.geometry?.properties?.radiusMeters
      ? String(zone.geometry.properties.radiusMeters)
      : "1000",
  );

  const handleGeometryChange = (geo: ZoneGeoFeature, type: ZoneGeometryType) => {
    setGeometry(geo);
    setZoneType(type);
    if (type === "circle" && geo.properties?.radiusMeters) {
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
        zone_type: zoneType,
        geometry,
      };

      const result = isEdit && zone
        ? await updateZone({ id: zone.id, ...payload })
        : await createZone(payload);

      if (result.error) {
        toast.error(t(`errors.${result.error}` as "errors.missing_fields"));
        return;
      }

      toast.success(isEdit ? t("updated") : t("created"));
      onClose();
      onSaved();
    });
  };

  return (
    <>
      <SheetHeader className="border-b border-border px-6 py-4">
        <SheetTitle>{isEdit ? t("editZoneTitle") : t("addZoneTitle")}</SheetTitle>
        <SheetDescription>{t("formDescription")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
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
          <p className="text-xs text-muted-foreground">{t("drawHint")}</p>
          <div className="zones-draw-map-wrapper rounded-xl border border-border">
            <ZoneMap
              zones={[]}
              selectedId={null}
              drawMode={zoneType}
              draftGeometry={geometry}
              draftZoneType={zoneType}
              onDraftGeometryChange={handleGeometryChange}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      <SheetFooter className="border-t border-border px-6 py-4">
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
          disabled={isPending || !name.trim() || !code.trim()}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            t("saveChanges")
          ) : (
            t("createZone")
          )}
        </Button>
      </SheetFooter>
    </>
  );
}

export function ZoneFormSheet({
  open,
  onOpenChange,
  zone,
  onSaved,
}: ZoneFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        showCloseButton
      >
        {open ? (
          <ZoneFormBody
            key={zone?.id ?? "new"}
            zone={zone ?? null}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
