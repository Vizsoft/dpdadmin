"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { queryKeys } from "@/lib/query/query-keys";
import { isDpdErrorKey, saveRestaurant } from "./dpd-actions";
import type { DpdScopeOptions, RestaurantRow } from "./types";

export function RestaurantFormSheet({
  restaurant,
  options,
  open,
  onOpenChange,
}: {
  restaurant: RestaurantRow | null;
  options: DpdScopeOptions | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.dpd");
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(restaurant);

  const [partnerId, setPartnerId] = useState(restaurant?.partner_id ?? "");
  const [name, setName] = useState(restaurant?.name ?? "");
  const [externalMerchantId, setExternalMerchantId] = useState(
    restaurant?.external_merchant_id ?? "",
  );
  const [isActive, setIsActive] = useState(restaurant?.is_active ?? true);

  useEffect(() => {
    if (!open) return;
    setPartnerId(restaurant?.partner_id ?? "");
    setName(restaurant?.name ?? "");
    setExternalMerchantId(restaurant?.external_merchant_id ?? "");
    setIsActive(restaurant?.is_active ?? true);
  }, [open, restaurant]);

  const errorToast = (error?: string) => {
    if (error && isDpdErrorKey(error)) return t(`errors.${error}`);
    return t("errors.save_failed");
  };

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      if (restaurant?.id) formData.append("id", restaurant.id);
      formData.append("partnerId", partnerId);
      formData.append("name", name);
      formData.append("externalMerchantId", externalMerchantId);
      formData.append("isActive", isActive ? "true" : "false");

      const result = await saveRestaurant(formData);
      if (result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      toast.success(isEdit ? t("restaurantUpdated") : t("restaurantCreated"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.dpd.all() });
      onOpenChange(false);
    });
  };

  const partners = options?.partners ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("editRestaurant") : t("addRestaurant")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("fields.partner")}</Label>
            <Select value={partnerId} onValueChange={(v) => setPartnerId(v ?? "")}>
              <SelectTrigger className="w-full cursor-pointer rounded-lg">
                <SelectValue placeholder={t("placeholders.selectPartner")} />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id} label={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="restaurant-name">{t("fields.restaurantName")}</Label>
            <Input
              id="restaurant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="external-id">{t("fields.externalMerchantId")}</Label>
            <Input
              id="external-id"
              value={externalMerchantId}
              onChange={(e) => setExternalMerchantId(e.target.value)}
              className="rounded-lg font-mono text-sm"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="restaurant-active">{t("fields.active")}</Label>
            <Switch
              id="restaurant-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
