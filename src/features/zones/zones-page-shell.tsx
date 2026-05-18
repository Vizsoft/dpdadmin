"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { queryKeys } from "@/lib/query/query-keys";
import { deleteZone } from "./zones-actions";
import { useZonesList } from "./use-zones";
import { ZoneFormSheet } from "./zone-form-sheet";
import { ZoneListPanel } from "./zone-list-panel";
import { ZoneMapPanel } from "./zone-map-panel";
import type { ZoneRow } from "./types";

export function ZonesPageShell() {
  const t = useTranslations("pages.zones");
  const { can } = useAuth();
  const canManage = can("zones.manage");
  const queryClient = useQueryClient();

  const { data: zones = [], isLoading, isFetching, refetch } = useZonesList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null);

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

  const handleRefresh = () => {
    void refetch();
    invalidateZones();
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
        toast.error(t(`errors.${result.error}` as "errors.missing_fields"));
        return;
      }
    } else {
      const confirmed = window.confirm(t("deleteConfirm", { name: zone.name }));
      if (!confirmed) return;
      const result = await deleteZone(zone.id);
      if (result.error) {
        toast.error(t(`errors.${result.error}` as "errors.missing_fields"));
        return;
      }
    }

    toast.success(t("deleted"));
    if (selectedId === zone.id) setSelectedId(null);
    invalidateZones();
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
            {canManage && (
              <Button
                type="button"
                className="cursor-pointer rounded-lg"
                onClick={handleAdd}
              >
                <Plus className="me-2 h-4 w-4" />
                {t("addZone")}
              </Button>
            )}
          </div>
        }
      />

      <div className="-mx-6 -mb-6 flex h-[calc(100dvh-8.5rem)] min-h-[560px] overflow-hidden border-t border-border">
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
          onEdit={handleEdit}
          onDelete={(zone) => void handleDelete(zone)}
        />
      </div>

      <ZoneFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        zone={editingZone}
        onSaved={invalidateZones}
      />
    </>
  );
}
