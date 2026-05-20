"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { ZoneMap } from "./zone-map";
import type { ZoneRow } from "./types";

export function ZoneMapPanel({
  zones,
  selectedZone,
  sheetOpen = false,
  onEdit,
  onDelete,
}: {
  zones: ZoneRow[];
  selectedZone: ZoneRow | null;
  sheetOpen?: boolean;
  onEdit: (zone: ZoneRow) => void;
  onDelete: (zone: ZoneRow) => void;
}) {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");

  return (
    <div
      className={cn(
        "relative z-0 min-h-0 flex-1",
        sheetOpen && "pointer-events-none",
      )}
    >
      <ZoneMap
        zones={zones}
        selectedId={selectedZone?.id ?? null}
        className="zones-background-map zones-leaflet-map h-full min-h-[480px] w-full"
      />

      {selectedZone && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
              style={{ backgroundColor: selectedZone.color }}
              aria-hidden
            />
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
