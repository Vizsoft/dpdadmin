"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  CIVIL_ID_DIGIT_COUNT,
  KUWAIT_PHONE_DIGIT_COUNT,
  phoneStorageToDigits,
  restrictDigits,
} from "./driver-phone";
import { updateDriverIntake } from "./drivers-actions";
import { isDriverErrorKey } from "./driver-errors";
import {
  hasValidationErrors,
  NONE_VEHICLE,
  validateDriverForm,
  type DriverFormErrors,
  type DriverFormField,
} from "./driver-form-validation";
import type { DriverErrorKey } from "./driver-errors";
import {
  ASSET_TYPES,
  DRIVER_WORKFLOW_STATUSES,
  type DriverAssetType,
  type DriverDetailModel,
  type DriverWorkflowStatus,
} from "./types";
import { useDriverFormOptions } from "./use-driver-form-options";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

function driverErrorToast(
  t: ReturnType<typeof useTranslations<"pages.driverNew">>,
  error?: string,
) {
  if (error && isDriverErrorKey(error)) {
    return t(`errors.${error}`);
  }
  return t("errors.save_failed");
}

function hasAnyAssetIssued(assets: Record<string, boolean>): boolean {
  return ASSET_TYPES.some((asset) => Boolean(assets[asset]));
}

export function DriverEditSheet({
  driver,
  intakeId,
  open,
  onOpenChange,
}: {
  driver: DriverDetailModel;
  intakeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.driverDetail");
  const tNew = useTranslations("pages.driverNew");
  const tList = useTranslations("pages.drivers");
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: options, isLoading: optionsLoading } = useDriverFormOptions();

  const [fullName, setFullName] = useState(driver.full_name);
  const [phone, setPhone] = useState(() => phoneStorageToDigits(driver.phone));
  const [civilId, setCivilId] = useState(() =>
    restrictDigits(driver.civil_id, CIVIL_ID_DIGIT_COUNT),
  );
  const [driverCode, setDriverCode] = useState(driver.driver_code);
  const [partnerId, setPartnerId] = useState(driver.partner_id);
  const [zoneId, setZoneId] = useState(driver.zone_id);
  const [vehicleId, setVehicleId] = useState(
    driver.vehicle_id ?? NONE_VEHICLE,
  );
  const [workflowStatus, setWorkflowStatus] = useState<DriverWorkflowStatus>(
    driver.workflow_status,
  );
  const [assetsEnabled, setAssetsEnabled] = useState(() =>
    hasAnyAssetIssued(driver.assets_issued),
  );
  const [assets, setAssets] = useState<Record<DriverAssetType, boolean>>(() => {
    const initial: Record<DriverAssetType, boolean> = {
      gps: false,
      sim: false,
      phone: false,
      delivery_bag: false,
      helmet: false,
      uniform: false,
    };
    for (const asset of ASSET_TYPES) {
      initial[asset] = Boolean(driver.assets_issued[asset]);
    }
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState<DriverFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(driver.full_name);
    setPhone(phoneStorageToDigits(driver.phone));
    setCivilId(restrictDigits(driver.civil_id, CIVIL_ID_DIGIT_COUNT));
    setDriverCode(driver.driver_code);
    setPartnerId(driver.partner_id);
    setZoneId(driver.zone_id);
    setVehicleId(driver.vehicle_id ?? NONE_VEHICLE);
    setWorkflowStatus(driver.workflow_status);
    const issued = hasAnyAssetIssued(driver.assets_issued);
    setAssetsEnabled(issued);
    setAssets(() => {
      const next: Record<DriverAssetType, boolean> = {
        gps: false,
        sim: false,
        phone: false,
        delivery_bag: false,
        helmet: false,
        uniform: false,
      };
      for (const asset of ASSET_TYPES) {
        next[asset] = Boolean(driver.assets_issued[asset]);
      }
      return next;
    });
    setFieldErrors({});
    setShowErrors(false);
  }, [open, driver]);

  const errorMessage = (key?: DriverErrorKey) =>
    key ? tNew(`errors.${key}`) : undefined;

  const clearFieldError = (field: DriverFormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const workflowLabel = (status: DriverWorkflowStatus) => {
    switch (status) {
      case "draft":
        return tList("statusDraft");
      case "pending":
        return tList("statusPending");
      case "approved":
        return tList("statusApproved");
      default:
        return status;
    }
  };

  const partners = options?.partners ?? [];
  const zones = options?.zones ?? [];
  const vehicles = options?.vehicles ?? [];

  const partnerLabel = (id: string) => partners.find((p) => p.id === id)?.name;
  const zoneLabel = (id: string) => {
    const z = zones.find((item) => item.id === id);
    return z ? `${z.name} (${z.code})` : undefined;
  };
  const vehicleLabel = (id: string) => {
    if (id === NONE_VEHICLE) return tNew("noVehicle");
    const v = vehicles.find((item) => item.id === id);
    return v
      ? `${v.bike_id}${v.reg_number ? ` · ${v.reg_number}` : ""}`
      : undefined;
  };

  const showFieldError = (field: DriverFormField) =>
    showErrors ? errorMessage(fieldErrors[field]) : undefined;

  const emptyDocuments = {
    license: null,
    civil_id: null,
    work_permit: null,
    passport: null,
  } as const;

  const handleSave = () => {
    const validation = validateDriverForm({
      fullName,
      phone,
      civilId,
      driverCode,
      partnerId,
      zoneId,
      documents: emptyDocuments,
    });
    setShowErrors(true);
    setFieldErrors(validation);
    if (hasValidationErrors(validation)) {
      const firstKey = Object.values(validation)[0];
      toast.error(driverErrorToast(tNew, firstKey));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("intakeId", intakeId);
      formData.append("fullName", fullName);
      formData.append("phone", phone);
      formData.append("civilId", civilId);
      formData.append("driverCode", driverCode);
      formData.append("partnerId", partnerId);
      formData.append("zoneId", zoneId);
      if (vehicleId && vehicleId !== NONE_VEHICLE) {
        formData.append("vehicleId", vehicleId);
      }
      formData.append("assetsEnabled", assetsEnabled ? "true" : "false");
      formData.append("workflowStatus", workflowStatus);
      for (const asset of ASSET_TYPES) {
        formData.append(`asset_${asset}`, assets[asset] ? "true" : "false");
      }

      const result = await updateDriverIntake(formData);
      if (result.error) {
        toast.error(driverErrorToast(tNew, result.error));
        return;
      }
      toast.success(t("updated"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{t("editTitle")}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-workflow-status">{tList("fieldWorkflowStatus")}</Label>
            <Select
              value={workflowStatus}
              onValueChange={(v) => {
                if (v) setWorkflowStatus(v as DriverWorkflowStatus);
              }}
              disabled={isPending}
            >
              <SelectTrigger
                id="edit-workflow-status"
                className="w-full cursor-pointer rounded-lg"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVER_WORKFLOW_STATUSES.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    label={workflowLabel(status)}
                  >
                    {workflowLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-full-name">{tNew("fields.fullName")}</Label>
              <Input
                id="edit-full-name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError("fullName");
                }}
                className="rounded-lg"
                aria-invalid={Boolean(showFieldError("fullName"))}
              />
              <FieldError message={showFieldError("fullName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{tNew("fields.phone")}</Label>
              <Input
                id="edit-phone"
                type="text"
                inputMode="numeric"
                maxLength={KUWAIT_PHONE_DIGIT_COUNT}
                value={phone}
                onChange={(e) => {
                  setPhone(restrictDigits(e.target.value, KUWAIT_PHONE_DIGIT_COUNT));
                  clearFieldError("phone");
                }}
                className="rounded-lg font-mono tabular-nums"
                aria-invalid={Boolean(showFieldError("phone"))}
              />
              <FieldError message={showFieldError("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-civil-id">{tNew("fields.civilId")}</Label>
              <Input
                id="edit-civil-id"
                type="text"
                inputMode="numeric"
                maxLength={CIVIL_ID_DIGIT_COUNT}
                value={civilId}
                onChange={(e) => {
                  setCivilId(restrictDigits(e.target.value, CIVIL_ID_DIGIT_COUNT));
                  clearFieldError("civilId");
                }}
                className="rounded-lg font-mono tabular-nums"
                aria-invalid={Boolean(showFieldError("civilId"))}
              />
              <FieldError message={showFieldError("civilId")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-driver-code">{tNew("fields.driverCode")}</Label>
              <Input
                id="edit-driver-code"
                value={driverCode}
                onChange={(e) => {
                  setDriverCode(e.target.value.toUpperCase());
                  clearFieldError("driverCode");
                }}
                className="rounded-lg font-mono"
                aria-invalid={Boolean(showFieldError("driverCode"))}
              />
              <FieldError message={showFieldError("driverCode")} />
            </div>
            <div className="space-y-1.5">
              <Label>{tNew("fields.partner")}</Label>
              <Select
                value={partnerId}
                onValueChange={(v) => {
                  setPartnerId(v ?? "");
                  clearFieldError("partnerId");
                }}
                disabled={optionsLoading || partners.length === 0}
              >
                <SelectTrigger
                  className="w-full cursor-pointer rounded-lg"
                  aria-invalid={Boolean(showFieldError("partnerId"))}
                >
                  <SelectValue placeholder={tNew("placeholders.partner")}>
                    {(value: string | null) =>
                      value ? (partnerLabel(value) ?? null) : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={showFieldError("partnerId")} />
            </div>
            <div className="space-y-1.5">
              <Label>{tNew("fields.zone")}</Label>
              <Select
                value={zoneId}
                onValueChange={(v) => {
                  setZoneId(v ?? "");
                  clearFieldError("zoneId");
                }}
                disabled={optionsLoading || zones.length === 0}
              >
                <SelectTrigger
                  className="w-full cursor-pointer rounded-lg"
                  aria-invalid={Boolean(showFieldError("zoneId"))}
                >
                  <SelectValue placeholder={tNew("placeholders.zone")}>
                    {(value: string | null) =>
                      value ? (zoneLabel(value) ?? null) : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem
                      key={z.id}
                      value={z.id}
                      label={`${z.name} (${z.code})`}
                    >
                      {z.name} ({z.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={showFieldError("zoneId")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{tNew("fields.vehicle")}</Label>
              <Select
                value={vehicleId}
                onValueChange={(v) => setVehicleId(v ?? NONE_VEHICLE)}
                disabled={optionsLoading}
              >
                <SelectTrigger className="w-full cursor-pointer rounded-lg">
                  <SelectValue placeholder={tNew("placeholders.vehicle")}>
                    {(value: string | null) =>
                      value ? (vehicleLabel(value) ?? null) : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VEHICLE} label={tNew("noVehicle")}>
                    {tNew("noVehicle")}
                  </SelectItem>
                  {vehicles.map((v) => {
                    const label = `${v.bike_id}${v.reg_number ? ` · ${v.reg_number}` : ""}`;
                    return (
                      <SelectItem key={v.id} value={v.id} label={label}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium">{tNew("sections.assets")}</Label>
              <Switch
                checked={assetsEnabled}
                onCheckedChange={setAssetsEnabled}
                aria-label={tNew("sections.assets")}
              />
            </div>
            {assetsEnabled ? (
              <div className="flex flex-wrap gap-4">
                {ASSET_TYPES.map((asset) => (
                  <label
                    key={asset}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={assets[asset]}
                      onCheckedChange={(checked) =>
                        setAssets((prev) => ({
                          ...prev,
                          [asset]: checked === true,
                        }))
                      }
                    />
                    {tNew(`assets.${asset}`)}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{tNew("assetsDisabled")}</p>
            )}
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
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
            disabled={isPending || optionsLoading}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("saveChanges")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
