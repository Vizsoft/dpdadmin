"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { queryKeys } from "@/lib/query/query-keys";
import { useZonesList } from "./use-zones";
import { ZoneFormSheet } from "./zone-form-sheet";
import { ZoneListPanel } from "./zone-list-panel";
import { ZoneMapPanel } from "./zone-map-panel";
import type { ZoneRow } from "./types";

function ZonesPageSkeleton() {
  return (
    <div className="flex h-full min-h-[560px] flex-col gap-4">
      <div className="h-10 shrink-0 animate-pulse rounded-lg bg-muted/40" />
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border">
        <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </aside>
        <div className="flex flex-1 items-center justify-center bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
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
    if (!selectedId) return null;
    return zones.some((z) => z.id === selectedId) ? selectedId : null;
  }, [zones, selectedId]);

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

  return (
    <AppPage className="flex h-full min-h-[560px] flex-col">
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
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

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <ZoneListPanel
          zones={zones}
          selectedId={effectiveSelectedId}
          isLoading={isLoading}
          onSelect={setSelectedId}
          onEdit={handleEdit}
        />
        <ZoneMapPanel
          zones={zones}
          selectedId={effectiveSelectedId}
          sheetOpen={sheetOpen}
        />
      </div>

      <ZoneFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        zone={editingZone}
        existingZones={zones}
        onSaved={invalidateZones}
        onDeleted={() => {
          if (editingZone && selectedId === editingZone.id) setSelectedId(null);
          invalidateZones();
        }}
      />
    </AppPage>
  );
}

export function ZonesPageShell() {
  const mounted = useHasMounted();

  if (!mounted) {
    return <ZonesPageSkeleton />;
  }

  return <ZonesPageContent />;
}
