"use client";

import { useTranslations } from "next-intl";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ZoneMap } from "./zone-map";
import type { ZoneRow } from "./types";

export function ZoneMapPanel({
  zones,
  selectedZone,
  onEdit,
  onDelete,
}: {
  zones: ZoneRow[];
  selectedZone: ZoneRow | null;
  onEdit: (zone: ZoneRow) => void;
  onDelete: (zone: ZoneRow) => void;
}) {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");

  return (
    <div className="relative min-h-0 flex-1">
      <ZoneMap
        zones={zones}
        selectedId={selectedZone?.id ?? null}
        className="h-full min-h-[480px] w-full"
      />

      {selectedZone && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <MapPin className="h-4 w-4 shrink-0 text-accent" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{selectedZone.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                #{selectedZone.code}
              </p>
            </div>
            {canManage && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => onEdit(selectedZone)}
                  aria-label={t("editZone")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer text-destructive hover:text-destructive"
                  onClick={() => onDelete(selectedZone)}
                  aria-label={t("deleteZone")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
