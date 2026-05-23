"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Filter, Loader2, Plus, Search } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { queryKeys } from "@/lib/query/query-keys";
import { cn } from "@/lib/utils";
import { useZonesList } from "./use-zones";
import { ZoneFormSheet } from "./zone-form-sheet";
import { ZoneGeofencesSummary, zoneMatchesKindFilter } from "./zone-geofences-summary";
import { ZoneListPanel } from "./zone-list-panel";
import { ZoneMapPanel } from "./zone-map-panel";
import type { GeofenceKind, ZoneRow } from "./types";

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
  const [kindFilter, setKindFilter] = useState<"all" | GeofenceKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneRow | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredZones = useMemo(
    () =>
      zones.filter((z) => {
        if (!zoneMatchesKindFilter(z, kindFilter)) return false;
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return (
          z.name.toLowerCase().includes(query) ||
          z.code.toLowerCase().includes(query)
        );
      }),
    [zones, kindFilter, search],
  );

  const kindChips: Array<{ id: "all" | GeofenceKind; label: string }> = [
    { id: "all", label: t("geofence.filterAll") },
    { id: "inclusion", label: t("geofence.filterInclusion") },
    { id: "exclusion", label: t("geofence.filterExclusion") },
  ];

  return (
    <AppPage className="flex h-full min-h-[560px] flex-col gap-4">
      <AppPageHeader
        title={t("geofence.pageTitle")}
        description={t("geofence.pageSubtitle")}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("placeholders.searchZones")}
            className="h-9 rounded-lg ps-8"
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="h-9 cursor-pointer rounded-lg">
          <Filter className="me-1.5 h-3.5 w-3.5" />
          {t("geofence.filters")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {t("geofence.bulkActions")}
            <ChevronDown className="ms-1.5 h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled>{t("geofence.bulkEnable")}</DropdownMenuItem>
            <DropdownMenuItem disabled>{t("geofence.bulkDisable")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>{t("geofence.bulkDelete")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {canManage ? (
          <Button type="button" size="sm" className="h-9 cursor-pointer rounded-lg" onClick={handleAdd}>
            <Plus className="me-1.5 h-3.5 w-3.5" />
            {t("geofence.createButton")}
          </Button>
        ) : null}
      </div>

      <ZoneGeofencesSummary zones={zones} />

      <div className="flex flex-wrap gap-1.5">
        {kindChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setKindFilter(chip.id)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              kindFilter === chip.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(520px,0.95fr)_1.05fr]">
        <ZoneListPanel
          zones={filteredZones}
          selectedId={effectiveSelectedId}
          isLoading={isLoading}
          onSelect={setSelectedId}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <ZoneMapPanel
          zones={filteredZones}
          selectedId={effectiveSelectedId}
          sheetOpen={sheetOpen}
          onZoneSelect={setSelectedId}
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
