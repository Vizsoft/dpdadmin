"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { useRestaurantsList } from "@/features/restaurants/use-restaurants";
import { selectOptionsFrom } from "@/lib/select-items";
import { useCreateVerification, useVerificationDriverOptions } from "./use-verifications";

export function AddVerificationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.verifications");
  const [driverSearch, setDriverSearch] = useState("");
  const [driverId, setDriverId] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [serviceDate, setServiceDate] = useState(
    () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date()),
  );
  const [reportedCount, setReportedCount] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const { data: drivers = [] } = useVerificationDriverOptions(driverSearch);
  const { data: restaurants = [] } = useRestaurantsList();

  const driverItems = useMemo(
    () =>
      selectOptionsFrom(
        drivers,
        (d) => d.id,
        (d) =>
          `${d.full_name} · ${d.driver_code}${
            d.employee_id ? ` · ${d.employee_id}` : ""
          }`,
      ),
    [drivers],
  );

  const restaurantItems = useMemo(() => {
    const published = restaurants.filter((r) => r.status === "published");
    return selectOptionsFrom(published, (r) => r.id, (r) => r.name);
  }, [restaurants]);

  const create = useCreateVerification();

  const reset = () => {
    setDriverSearch("");
    setDriverId("");
    setRestaurantId("");
    setReportedCount("");
    setNotes("");
  };

  const handleSubmit = () => {
    const count = parseInt(reportedCount, 10);
    if (!driverId || !restaurantId || !serviceDate) {
      toast.error(t("errors.missingFields"));
      return;
    }
    if (!Number.isFinite(count) || count < 0) {
      toast.error(t("errors.invalidCount"));
      return;
    }
    startTransition(async () => {
      const result = await create.mutateAsync({
        driverId,
        restaurantId,
        serviceDate,
        reportedCount: count,
        notes: notes.trim() || undefined,
      });
      if ("error" in result) {
        const key = result.error;
        toast.error(t(`errors.${key}` as "errors.save_failed"));
        return;
      }
      toast.success(t("createSuccess"));
      reset();
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addVerification")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("searchDriver")}</Label>
            <Input
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              placeholder={t("searchDriverPlaceholder")}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("fieldDriver")}</Label>
            <Select
              items={driverItems}
              value={driverId || null}
              onValueChange={(v) => setDriverId(v ?? "")}
            >
              <SelectTrigger className="w-full cursor-pointer rounded-lg">
                <SelectValue placeholder={t("selectDriver")} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem
                    key={d.id}
                    value={d.id}
                    label={`${d.full_name} · ${d.driver_code}`}
                  >
                    {d.full_name} · {d.driver_code}
                    {d.employee_id ? ` · ${d.employee_id}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("fieldRestaurant")}</Label>
            <Select
              items={restaurantItems}
              value={restaurantId || null}
              onValueChange={(v) => setRestaurantId(v ?? "")}
            >
              <SelectTrigger className="w-full cursor-pointer rounded-lg">
                <SelectValue placeholder={t("selectRestaurant")} />
              </SelectTrigger>
              <SelectContent>
                {restaurants
                  .filter((r) => r.status === "published")
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id} label={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="service-date">{t("fieldDate")}</Label>
              <Input
                id="service-date"
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reported-count">{t("fieldReported")}</Label>
              <Input
                id="reported-count"
                type="number"
                min={0}
                value={reportedCount}
                onChange={(e) => setReportedCount(e.target.value)}
                className="rounded-lg tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("fieldNotes")}</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            disabled={isPending}
            onClick={handleSubmit}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
