"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Filter, Loader2, Plus, Search } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
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
import { cn } from "@/lib/utils";
import { useZonesList } from "./use-zones";
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
  const router = useRouter();
  const { can } = useAuth();
  const canManage = can("zones.manage");

  const { data: zones = [], isLoading } = useZonesList();
  const [kindFilter, setKindFilter] = useState<"all" | GeofenceKind>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const effectiveSelectedId = useMemo(() => {
    if (!selectedId) return null;
    return zones.some((z) => z.id === selectedId) ? selectedId : null;
  }, [zones, selectedId]);

  const handleAdd = () => {
    router.push("/zones/new");
  };

  const handleEdit = (zone: ZoneRow) => {
    router.push(`/zones/${zone.id}/edit`);
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {t("geofence.pageTitle")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {t("geofence.pageSubtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative min-w-[240px] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("placeholders.searchZones")}
            className="h-9 rounded-lg border-slate-200 bg-slate-50 ps-8 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="h-9 cursor-pointer rounded-lg border-slate-200 dark:border-slate-700">
          <Filter className="me-1.5 h-3.5 w-3.5" />
          {t("geofence.filters")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium shadow-xs transition-[color,box-shadow] hover:bg-slate-100 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
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
          <Button type="button" size="sm" className="h-9 cursor-pointer rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={handleAdd}>
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
        />
        <ZoneMapPanel
          zones={filteredZones}
          selectedId={effectiveSelectedId}
          onZoneSelect={setSelectedId}
        />
      </div>
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
