"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { canManageRestaurants } from "@/lib/auth/permissions";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query/query-keys";
import {
  deleteRestaurant,
  isRestaurantErrorKey,
  saveRestaurant,
} from "./restaurants-actions";
import { RestaurantFormFields } from "./restaurant-form-fields";
import type { RestaurantStatus } from "./restaurant-status";
import {
  useRestaurantPartnerOptions,
  useRestaurantZoneOptions,
} from "./use-restaurants";
import type { RestaurantRow } from "./types";

function errorToast(
  t: ReturnType<typeof useTranslations<"pages.restaurants">>,
  error?: string,
) {
  if (error && isRestaurantErrorKey(error)) return t(`errors.${error}`);
  return t("errors.save_failed");
}

function RestaurantFormBody({
  restaurant,
  onClose,
  onSaved,
  onRequestDelete,
}: {
  restaurant: RestaurantRow | null;
  onClose: () => void;
  onSaved: () => void;
  onRequestDelete: () => void;
}) {
  const t = useTranslations("pages.restaurants");
  const { permissions, isSuperAdmin } = useAuth();
  const canManage = canManageRestaurants(new Set(permissions), isSuperAdmin);
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: partners = [], isLoading: partnersLoading } =
    useRestaurantPartnerOptions();
  const { data: zones = [], isLoading: zonesLoading } = useRestaurantZoneOptions();

  const isEdit = Boolean(restaurant);

  const [partnerId, setPartnerId] = useState(restaurant?.partner_id ?? "");
  const [zoneId, setZoneId] = useState(restaurant?.zone_id ?? "");
  const [name, setName] = useState(restaurant?.name ?? "");
  const [externalMerchantId, setExternalMerchantId] = useState(
    restaurant?.external_merchant_id ?? "",
  );
  const [mapLink, setMapLink] = useState(restaurant?.map_link ?? "");
  const [status, setStatus] = useState<RestaurantStatus>(
    restaurant?.status ?? "draft",
  );

  const fieldLabels = {
    partner: t("fields.partner"),
    zone: t("fields.zone"),
    name: t("fields.name"),
    externalMerchantId: t("fields.externalMerchantId"),
    externalMerchantIdHint: t("hints.externalMerchantId"),
    mapLink: t("fields.mapLink"),
    mapLinkHint: t("hints.mapLink"),
    status: t("fields.status"),
    statusHint: t("hints.status"),
    selectPartner: t("placeholders.selectPartner"),
    selectZone: t("placeholders.selectZone"),
    namePlaceholder: t("placeholders.name"),
    mapLinkPlaceholder: t("placeholders.mapLink"),
    statusDraft: t("statusDraft"),
    statusPublished: t("statusPublished"),
    statusArchived: t("statusArchived"),
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all() });
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.drivers.all(), "form-options"],
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dpd.all() });
  };

  const handleSave = () => {
    if (!partnerId.trim() || !zoneId.trim() || !name.trim()) {
      toast.error(t("errors.missing_fields"));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (restaurant?.id) formData.append("id", restaurant.id);
      formData.append("partnerId", partnerId);
      formData.append("zoneId", zoneId);
      formData.append("name", name);
      formData.append("externalMerchantId", externalMerchantId);
      formData.append("mapLink", mapLink);
      formData.append("status", status);

      const result = await saveRestaurant(formData);
      if (result.error) {
        toast.error(errorToast(t, result.error));
        return;
      }
      toast.success(isEdit ? t("restaurantUpdated") : t("restaurantCreated"));
      await invalidate();
      onSaved();
      onClose();
    });
  };

  return (
    <>
      <DialogHeader className="border-b border-border px-6 py-4 pr-14">
        <DialogTitle>
          {isEdit ? t("editRestaurant") : t("addRestaurant")}
        </DialogTitle>
      </DialogHeader>

      <div className="overflow-y-auto px-6 py-4">
        <RestaurantFormFields
          labels={fieldLabels}
          partnerId={partnerId}
          zoneId={zoneId}
          name={name}
          externalMerchantId={externalMerchantId}
          mapLink={mapLink}
          status={status}
          partners={partners}
          zones={zones}
          partnersLoading={partnersLoading}
          zonesLoading={zonesLoading}
          onPartnerIdChange={setPartnerId}
          onZoneIdChange={setZoneId}
          onNameChange={setName}
          onExternalMerchantIdChange={setExternalMerchantId}
          onMapLinkChange={setMapLink}
          onStatusChange={setStatus}
        />
        {!partnersLoading && partners.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("errors.noPartners")}
          </p>
        ) : null}
        {!zonesLoading && zones.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("errors.noZones")}
          </p>
        ) : null}
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
        {isEdit && canManage ? (
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRequestDelete}
            disabled={isPending}
          >
            <Trash2 className="me-2 h-3.5 w-3.5" />
            {t("deleteRestaurant")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            onClick={onClose}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          {canManage ? (
            <Button
              type="button"
              className="cursor-pointer rounded-lg"
              onClick={handleSave}
              disabled={
                isPending || !partnerId || !zoneId || !name.trim()
              }
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                t("save")
              ) : (
                t("createRestaurant")
              )}
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </>
  );
}

export function RestaurantFormSheet({
  restaurant,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  restaurant: RestaurantRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const t = useTranslations("pages.restaurants");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!restaurant?.id) return;
    startTransition(async () => {
      const result = await deleteRestaurant(restaurant.id);
      if (result.error) {
        toast.error(
          result.error && isRestaurantErrorKey(result.error)
            ? t(`errors.${result.error}`)
            : t("errors.delete_failed"),
        );
        throw new Error(result.error);
      }
      toast.success(t("restaurantDeleted"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all() });
      onDeleted();
      onOpenChange(false);
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] max-w-md flex-col gap-0"
          showCloseButton
        >
          {open ? (
            <RestaurantFormBody
              key={restaurant?.id ?? "new"}
              restaurant={restaurant}
              onClose={() => onOpenChange(false)}
              onSaved={onSaved}
              onRequestDelete={() => setDeleteOpen(true)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {restaurant ? (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          itemTitle={t("deleteRestaurantTitle")}
          itemName={restaurant.name}
          confirmText={restaurant.name}
          warning={t("deleteRestaurantDescription", { name: restaurant.name })}
          onConfirm={handleDelete}
          isPending={isPending}
        />
      ) : null}
    </>
  );
}
