"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageContentHeader } from "@/components/dashboard/page-content-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { queryKeys } from "@/lib/query/query-keys";
import { deleteZone } from "./zones-actions";
import { isZoneErrorKey } from "./zone-errors";
import { useZonesList } from "./use-zones";
import { ZoneFormSheet } from "./zone-form-sheet";
import { ZoneListPanel } from "./zone-list-panel";
import { ZoneMapPanel } from "./zone-map-panel";
import type { ZoneRow } from "./types";

function ZonesPageSkeleton() {
  return (
    <div className="-my-4 -me-4 flex h-[calc(100svh-2rem)] min-h-[560px] overflow-hidden md:-my-6 md:-me-6 md:h-[calc(100svh-3rem)]">
      <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-border bg-card">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </aside>
      <div className="flex flex-1 items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

function ZonesPageContent() {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const queryClient = useQueryClient();

  const { data: zones = [], isLoading, refetch } = useZonesList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const effectiveSelectedId = useMemo(() => {
    if (zones.length === 0) return null;
    if (selectedId && zones.some((z) => z.id === selectedId)) return selectedId;
    return zones[0].id;
  }, [zones, selectedId]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === effectiveSelectedId) ?? null,
    [zones, effectiveSelectedId],
  );

  const invalidateZones = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.zones.all() });
  }, [queryClient]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAdd = () => {
    setEditingZone(null);
    setSheetOpen(true);
  };

  const handleEdit = (zone: ZoneRow) => {
    setEditingZone(zone);
    setSheetOpen(true);
  };

  const handleDelete = async (zone: ZoneRow) => {
    if (zone.driver_count > 0) {
      const confirmed = window.confirm(t("deleteConfirmWithDrivers", { count: zone.driver_count }));
      if (!confirmed) return;
      const result = await deleteZone(zone.id, true);
      if (result.error) {
        toast.error(
          isZoneErrorKey(result.error)
            ? t(`errors.${result.error}`)
            : t("errors.save_failed"),
        );
        return;
      }
    } else {
      const confirmed = window.confirm(t("deleteConfirm", { name: zone.name }));
      if (!confirmed) return;
      const result = await deleteZone(zone.id);
      if (result.error) {
        toast.error(
          isZoneErrorKey(result.error)
            ? t(`errors.${result.error}`)
            : t("errors.save_failed"),
        );
        return;
      }
    }

    toast.success(t("deleted"));
    if (selectedId === zone.id) setSelectedId(null);
    invalidateZones();
  };

  return (
    <div className="-my-4 -me-4 flex h-[calc(100svh-2rem)] min-h-[560px] flex-col overflow-hidden md:-my-6 md:-me-6 md:h-[calc(100svh-3rem)]">
      <div className="shrink-0 pb-3">
        <PageContentHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`me-2 h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {t("refresh")}
              </Button>
              {canManage && (
                <Button type="button" size="sm" className="cursor-pointer" onClick={handleAdd}>
                  <Plus className="me-2 h-3.5 w-3.5" />
                  {t("addZone")}
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden border border-border">
        <ZoneListPanel
          zones={zones}
          selectedId={effectiveSelectedId}
          isLoading={isLoading}
          onSelect={setSelectedId}
          onEdit={handleEdit}
          onDelete={(zone) => void handleDelete(zone)}
        />
        <ZoneMapPanel
          zones={zones}
          selectedZone={selectedZone}
          sheetOpen={sheetOpen}
          onEdit={handleEdit}
          onDelete={(zone) => void handleDelete(zone)}
        />
      </div>

      <ZoneFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        zone={editingZone}
        existingZones={zones}
        onSaved={invalidateZones}
      />
    </div>
  );
}

export function ZonesPageShell() {
  const mounted = useHasMounted();

  if (!mounted) {
    return <ZonesPageSkeleton />;
  }

  return <ZonesPageContent />;
}
