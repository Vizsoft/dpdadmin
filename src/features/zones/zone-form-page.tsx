"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { queryKeys } from "@/lib/query/query-keys";
import { isZoneErrorKey } from "./zone-errors";
import { ZoneFormBody } from "./zone-form-sheet";
import { deleteZone } from "./zones-actions";
import { useZonesList } from "./use-zones";

function zoneErrorToast(
  t: ReturnType<typeof useTranslations<"pages.zones">>,
  error?: string,
) {
  if (error && isZoneErrorKey(error)) {
    return t(`errors.${error}`);
  }
  return t("errors.save_failed");
}

export function ZoneFormPage({ zoneId }: { zoneId?: string }) {
  const t = useTranslations("pages.zones");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: zones = [] } = useZonesList();
  const zone = useMemo(
    () => (zoneId ? zones.find((item) => item.id === zoneId) ?? null : null),
    [zoneId, zones],
  );

  const invalidateZones = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.zones.all() });
  };

  const runDelete = async () => {
    if (!zone) return;
    const force = zone.driver_count > 0;
    const result = await deleteZone(zone.id, force);
    if (result.error) {
      toast.error(zoneErrorToast(t, result.error));
      throw new Error(result.error);
    }
    toast.success(t("deleted"));
    invalidateZones();
    router.push("/zones");
  };

  if (zoneId && !zone) {
    return (
      <AppPage className="space-y-4">
        <AppPageHeader
          title={t("editZoneTitle")}
          breadcrumbs={[
            { label: t("geofence.pageTitle"), href: "/zones" },
            { label: t("editZoneTitle") },
          ]}
        />
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("emptyTitle")}
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage className="flex h-full flex-col gap-3">
      <AppPageHeader
        title={zone ? t("editZoneTitle") : t("addZoneTitle")}
        breadcrumbs={[
          { label: t("geofence.pageTitle"), href: "/zones" },
          { label: zone ? t("editZoneTitle") : t("addZoneTitle") },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <ZoneFormBody
          zone={zone}
          existingZones={zones}
          onClose={() => router.push("/zones")}
          onSaved={() => {
            invalidateZones();
            router.push("/zones");
          }}
          onRequestDelete={() => setDeleteOpen(true)}
          asPage
        />
      </div>
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
    </AppPage>
  );
}
