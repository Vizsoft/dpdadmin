"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AppFormSection } from "@/components/app/app-form-section";
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
import { isR2Configured } from "@/lib/storage/r2-config";
import { queryKeys } from "@/lib/query/query-keys";
import { selectOptions, selectOptionsFrom } from "@/lib/select-items";
import { DriverAvatarUpload } from "./driver-avatar-upload";
import { isDriverErrorKey } from "./driver-errors";
import {
  CIVIL_ID_DIGIT_COUNT,
  KUWAIT_PHONE_DIGIT_COUNT,
  phoneStorageToDigits,
  restrictDigits,
} from "./driver-phone";
import { DriverDocumentUpload } from "./driver-document-upload";
import {
  hasValidationErrors,
  NONE_VEHICLE,
  validateDriverForm,
  type DriverFormErrors,
  type DriverFormField,
} from "./driver-form-validation";
import { DriverRestaurantPicker } from "./driver-restaurant-picker";
import {
  createDriverIntake,
  updateDriverIntake,
} from "./drivers-actions";
import {
  ASSET_TYPES,
  DOCUMENT_TYPES,
  DRIVER_WORKFLOW_STATUSES,
  type DriverAssetType,
  type DriverDetailModel,
  type DriverDocumentType,
  type DriverRemoteDocument,
  type DriverWorkflowStatus,
} from "./types";
import { useDriverFormOptions } from "./use-driver-form-options";
import type { DriverErrorKey } from "./driver-errors";

type DriverFormMode = "create" | "edit";

function hasAnyAssetIssued(assets: Record<string, boolean>): boolean {
  return ASSET_TYPES.some((asset) => Boolean(assets[asset]));
}

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
  if (error && isDriverErrorKey(error)) return t(`errors.${error}`);
  return t("errors.save_failed");
}

const EMPTY_DOCS: Record<DriverDocumentType, File | null> = {
  license: null,
  civil_id: null,
  work_permit: null,
  passport: null,
};

const EMPTY_ASSETS: Record<DriverAssetType, boolean> = {
  gps: false,
  sim: false,
  phone: false,
  delivery_bag: false,
  helmet: false,
  uniform: false,
};

export function DriverFormSheet({
  mode,
  open,
  onOpenChange,
  driver,
  intakeId,
  onSaved,
}: {
  mode: DriverFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: DriverDetailModel | null;
  intakeId?: string;
  onSaved?: () => void;
}) {
  const tNew = useTranslations("pages.driverNew");
  const tDetail = useTranslations("pages.driverDetail");
  const tList = useTranslations("pages.drivers");
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [r2Ready, setR2Ready] = useState(true);
  const { data: options, isLoading: optionsLoading } = useDriverFormOptions();
  const isEdit = mode === "edit";
  const activeDriver = isEdit ? driver ?? null : null;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [civilId, setCivilId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [vehicleId, setVehicleId] = useState(NONE_VEHICLE);
  const [workflowStatus, setWorkflowStatus] = useState<DriverWorkflowStatus>("draft");
  const [assetsEnabled, setAssetsEnabled] = useState(true);
  const [assets, setAssets] = useState<Record<DriverAssetType, boolean>>({
    ...EMPTY_ASSETS,
    gps: true,
    sim: true,
    phone: true,
    delivery_bag: true,
    helmet: true,
    uniform: true,
  });
  const [documents, setDocuments] = useState<Record<DriverDocumentType, File | null>>(
    EMPTY_DOCS,
  );
  const [remoteDocuments, setRemoteDocuments] = useState<
    Partial<Record<DriverDocumentType, DriverRemoteDocument>>
  >({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<DriverFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    void isR2Configured().then(setR2Ready);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (isEdit && activeDriver) {
      setFullName(activeDriver.full_name);
      setPhone(phoneStorageToDigits(activeDriver.phone));
      setCivilId(restrictDigits(activeDriver.civil_id, CIVIL_ID_DIGIT_COUNT));
      setEmployeeId(activeDriver.employee_id ?? "");
      setPartnerId(activeDriver.partner_id ?? "");
      setRestaurantIds(activeDriver.restaurant_ids);
      setZoneId(activeDriver.zone_id ?? "");
      setVehicleId(activeDriver.vehicle_id ?? NONE_VEHICLE);
      setWorkflowStatus(activeDriver.workflow_status);
      const issued = hasAnyAssetIssued(activeDriver.assets_issued);
      setAssetsEnabled(issued);
      setAssets(() => {
        const next = { ...EMPTY_ASSETS };
        for (const asset of ASSET_TYPES) {
          next[asset] = Boolean(activeDriver.assets_issued[asset]);
        }
        return next;
      });
      setDocuments(EMPTY_DOCS);
      setRemoteDocuments(activeDriver.documents ?? {});
      setAvatarPreview(activeDriver.avatar_url ?? null);
    } else {
      setFullName("");
      setPhone("");
      setCivilId("");
      setEmployeeId("");
      setPartnerId("");
      setRestaurantIds([]);
      setZoneId("");
      setVehicleId(NONE_VEHICLE);
      setWorkflowStatus("draft");
      setAssetsEnabled(true);
      setAssets({
        ...EMPTY_ASSETS,
        gps: true,
        sim: true,
        phone: true,
        delivery_bag: true,
        helmet: true,
        uniform: true,
      });
      setDocuments(EMPTY_DOCS);
      setRemoteDocuments({});
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    setRemoveAvatar(false);
    setFieldErrors({});
    setShowErrors(false);
  }, [open, isEdit, activeDriver]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const errorMessage = (key?: DriverErrorKey) => (key ? tNew(`errors.${key}`) : undefined);

  const clearFieldError = (field: DriverFormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearDocumentError = (docType: DriverDocumentType) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`document_${docType}`];
      return next;
    });
  };

  const showFieldError = (field: DriverFormField) =>
    showErrors ? errorMessage(fieldErrors[field]) : undefined;
  const showDocumentError = (docType: DriverDocumentType) =>
    showErrors ? errorMessage(fieldErrors[`document_${docType}`]) : undefined;

  const partners = options?.partners ?? [];
  const zones = options?.zones ?? [];
  const vehicles = options?.vehicles ?? [];
  const allRestaurants = options?.restaurants ?? [];

  const partnerSelectItems = useMemo(
    () => selectOptionsFrom(partners, (p) => p.id, (p) => p.name),
    [partners],
  );
  const zoneSelectItems = useMemo(
    () => selectOptionsFrom(zones, (z) => z.id, (z) => `${z.name} (${z.code})`),
    [zones],
  );
  const vehicleSelectItems = useMemo(
    () =>
      selectOptions([
        { value: NONE_VEHICLE, label: tNew("noVehicle") },
        ...vehicles.map((v) => ({
          value: v.id,
          label: `${v.bike_id}${v.reg_number ? ` · ${v.reg_number}` : ""}`,
        })),
      ]),
    [tNew, vehicles],
  );

  const hasDocumentUploads = DOCUMENT_TYPES.some((docType) => documents[docType] != null);
  const needsR2ForSubmit = (hasDocumentUploads || avatarFile != null) && !r2Ready;

  const saveLabel = isEdit ? tDetail("saveChanges") : tNew("createDriver");
  const titleLabel = isEdit ? tDetail("editTitle") : tNew("title");

  const handleAvatarSelect = (file: File | null) => {
    if (!file) return;
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarRemove = () => {
    if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const submit = () => {
    const validation = validateDriverForm({
      fullName,
      phone,
      civilId,
      partnerId,
      zoneId,
      documents: isEdit ? EMPTY_DOCS : documents,
    });
    setShowErrors(true);
    setFieldErrors(validation);
    if (hasValidationErrors(validation)) {
      const firstKey = Object.values(validation)[0];
      toast.error(driverErrorToast(tNew, firstKey));
      return;
    }
    if (needsR2ForSubmit) {
      toast.error(driverErrorToast(tNew, "r2_not_configured"));
      return;
    }
    if (isEdit && (!activeDriver || !intakeId)) {
      toast.error(driverErrorToast(tNew, "save_failed"));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phone", phone);
      formData.append("civilId", civilId);
      formData.append("partnerId", partnerId);
      formData.append("zoneId", zoneId);
      if (vehicleId && vehicleId !== NONE_VEHICLE) {
        formData.append("vehicleId", vehicleId);
      }
      formData.append("assetsEnabled", assetsEnabled ? "true" : "false");
      for (const asset of ASSET_TYPES) {
        formData.append(`asset_${asset}`, assets[asset] ? "true" : "false");
      }
      for (const rid of restaurantIds) {
        formData.append("restaurantIds", rid);
      }
      if (avatarFile) formData.append("avatar", avatarFile);
      if (removeAvatar) formData.append("removeAvatar", "true");

      if (isEdit && activeDriver && intakeId) {
        formData.append("intakeId", intakeId);
        formData.append("employeeId", employeeId);
        formData.append("workflowStatus", workflowStatus);
        const result = await updateDriverIntake(formData);
        if (result.error) {
          toast.error(driverErrorToast(tNew, result.error));
          return;
        }
        toast.success(tDetail("updated"));
        await queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.drivers.detail(activeDriver.id),
        });
      } else {
        for (const docType of DOCUMENT_TYPES) {
          const file = documents[docType];
          if (file) formData.append(`doc_${docType}`, file);
        }
        const result = await createDriverIntake(formData);
        if (result.error) {
          toast.error(driverErrorToast(tNew, result.error));
          return;
        }
        if (result.driver_code) {
          toast.success(tNew("createdWithCode", { code: result.driver_code }));
        } else {
          toast.success(tNew("created"));
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
      }

      onSaved?.();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[90vw] flex-col gap-0 p-0"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-border px-6 py-3">
          <DialogTitle>{titleLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="w-full shrink-0 border-b border-border p-4 lg:w-[250px] lg:border-b-0 lg:border-e">
            <DriverAvatarUpload
              fullName={fullName}
              previewUrl={avatarPreview}
              disabled={isPending}
              uploadLabel={tNew("uploadPhoto")}
              removeLabel={tNew("removePhoto")}
              hint={tNew("profilePhotoHint")}
              onFileSelect={handleAvatarSelect}
              onRemove={handleAvatarRemove}
            />
            <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
              <p className="text-muted-foreground">{tNew("fields.driverCode")}</p>
              <p className="mt-1 font-mono text-sm text-foreground">
                {isEdit ? activeDriver?.driver_code : tNew("placeholders.driverCodeAuto")}
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {isEdit ? (
                <AppFormSection title={tList("fieldWorkflowStatus")} className="[&>div]:p-4">
                  <Select
                    items={selectOptionsFrom(
                      DRIVER_WORKFLOW_STATUSES,
                      (status) => status,
                      (status) =>
                        status === "draft"
                          ? tList("statusDraft")
                          : status === "pending"
                            ? tList("statusPending")
                            : tList("statusApproved"),
                    )}
                    value={workflowStatus ?? null}
                    onValueChange={(value) => {
                      if (value) setWorkflowStatus(value as DriverWorkflowStatus);
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full cursor-pointer rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRIVER_WORKFLOW_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} label={status}>
                          {status === "draft"
                            ? tList("statusDraft")
                            : status === "pending"
                              ? tList("statusPending")
                              : tList("statusApproved")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AppFormSection>
              ) : null}

              <AppFormSection title={tNew("sections.basic")} className="[&>div]:p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="driver-full-name">{tNew("fields.fullName")}</Label>
                    <Input
                      id="driver-full-name"
                      value={fullName}
                      onChange={(event) => {
                        setFullName(event.target.value);
                        clearFieldError("fullName");
                      }}
                      className="rounded-lg"
                      aria-invalid={Boolean(showFieldError("fullName"))}
                    />
                    <FieldError message={showFieldError("fullName")} />
                  </div>
                  {isEdit && activeDriver?.linked_profile_id ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="driver-employee-id">{tList("employeeId")}</Label>
                      <Input
                        id="driver-employee-id"
                        value={employeeId}
                        onChange={(event) => setEmployeeId(event.target.value)}
                        className="rounded-lg font-mono tabular-nums"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="driver-phone">{tNew("fields.phone")}</Label>
                    <Input
                      id="driver-phone"
                      type="text"
                      inputMode="numeric"
                      maxLength={KUWAIT_PHONE_DIGIT_COUNT}
                      value={phone}
                      onChange={(event) => {
                        setPhone(restrictDigits(event.target.value, KUWAIT_PHONE_DIGIT_COUNT));
                        clearFieldError("phone");
                      }}
                      className="rounded-lg font-mono tabular-nums"
                      aria-invalid={Boolean(showFieldError("phone"))}
                    />
                    <FieldError message={showFieldError("phone")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="driver-civil-id">{tNew("fields.civilId")}</Label>
                    <Input
                      id="driver-civil-id"
                      type="text"
                      inputMode="numeric"
                      maxLength={CIVIL_ID_DIGIT_COUNT}
                      value={civilId}
                      onChange={(event) => {
                        setCivilId(restrictDigits(event.target.value, CIVIL_ID_DIGIT_COUNT));
                        clearFieldError("civilId");
                      }}
                      className="rounded-lg font-mono tabular-nums"
                      aria-invalid={Boolean(showFieldError("civilId"))}
                    />
                    <FieldError message={showFieldError("civilId")} />
                  </div>
                </div>
              </AppFormSection>

              <AppFormSection title={tNew("sections.assignment")} className="[&>div]:p-4">
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label>{tNew("fields.partner")}</Label>
                    <Select
                      items={partnerSelectItems}
                      value={partnerId || null}
                      onValueChange={(value) => {
                        setPartnerId(value ?? "");
                        clearFieldError("partnerId");
                      }}
                      disabled={optionsLoading || partners.length === 0}
                    >
                      <SelectTrigger
                        className="h-9 w-full cursor-pointer rounded-lg"
                        aria-invalid={Boolean(showFieldError("partnerId"))}
                      >
                        <SelectValue placeholder={tNew("placeholders.partner")} />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id} label={partner.name}>
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={showFieldError("partnerId")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tNew("fields.zone")}</Label>
                    <Select
                      items={zoneSelectItems}
                      value={zoneId || null}
                      onValueChange={(value) => {
                        setZoneId(value ?? "");
                        clearFieldError("zoneId");
                      }}
                      disabled={optionsLoading || zones.length === 0}
                    >
                      <SelectTrigger
                        className="h-9 w-full cursor-pointer rounded-lg"
                        aria-invalid={Boolean(showFieldError("zoneId"))}
                      >
                        <SelectValue placeholder={tNew("placeholders.zone")} />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem
                            key={zone.id}
                            value={zone.id}
                            label={`${zone.name} (${zone.code})`}
                          >
                            {zone.name} ({zone.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={showFieldError("zoneId")} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>{tNew("fields.vehicle")}</Label>
                    <Select
                      items={vehicleSelectItems}
                      value={vehicleId || null}
                      onValueChange={(value) => setVehicleId(value ?? NONE_VEHICLE)}
                      disabled={optionsLoading}
                    >
                      <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg">
                        <SelectValue placeholder={tNew("placeholders.vehicle")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VEHICLE} label={tNew("noVehicle")}>
                          {tNew("noVehicle")}
                        </SelectItem>
                        {vehicles.map((vehicle) => {
                          const label = `${vehicle.bike_id}${
                            vehicle.reg_number ? ` · ${vehicle.reg_number}` : ""
                          }`;
                          return (
                            <SelectItem key={vehicle.id} value={vehicle.id} label={label}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AppFormSection>

              <AppFormSection
                title={tNew("sections.restaurants")}
                description={tNew("sections.restaurantsDescription")}
                className="[&>div]:p-4"
              >
                <DriverRestaurantPicker
                  restaurants={allRestaurants}
                  selectedIds={restaurantIds}
                  onChange={setRestaurantIds}
                  disabled={optionsLoading || isPending}
                />
              </AppFormSection>

              <AppFormSection
                title={tNew("sections.assets")}
                action={
                  <Switch
                    checked={assetsEnabled}
                    onCheckedChange={setAssetsEnabled}
                    aria-label={tNew("sections.assets")}
                  />
                }
                className="[&>div]:p-4"
              >
                {assetsEnabled ? (
                  <div className="flex flex-wrap gap-4">
                    {ASSET_TYPES.map((asset) => (
                      <label key={asset} className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={assets[asset]}
                          onCheckedChange={(checked) =>
                            setAssets((prev) => ({ ...prev, [asset]: checked === true }))
                          }
                        />
                        {tNew(`assets.${asset}`)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{tNew("assetsDisabled")}</p>
                )}
              </AppFormSection>

              <AppFormSection
                title={isEdit ? tDetail("documentsTitle") : tNew("sections.documents")}
                description={
                  isEdit ? tDetail("documentsDescription") : tNew("sections.documentsDescription")
                }
                className="[&>div]:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {DOCUMENT_TYPES.map((docType) =>
                    isEdit && activeDriver ? (
                      <DriverDocumentUpload
                        key={docType}
                        mode="remote"
                        docType={docType}
                        intakeId={intakeId ?? ""}
                        driverProfileId={activeDriver.linked_profile_id}
                        existing={remoteDocuments[docType] ?? null}
                        disabled={isPending}
                        onChanged={(next) => {
                          setRemoteDocuments((prev) => {
                            const updated = { ...prev };
                            if (next) updated[docType] = next;
                            else delete updated[docType];
                            return updated;
                          });
                          void queryClient.invalidateQueries({
                            queryKey: queryKeys.drivers.detail(activeDriver.id),
                          });
                        }}
                      />
                    ) : (
                      <DriverDocumentUpload
                        key={docType}
                        mode="inline"
                        docType={docType}
                        file={documents[docType]}
                        isSubmitting={isPending}
                        error={showDocumentError(docType)}
                        onChange={(file) => {
                          setDocuments((prev) => ({ ...prev, [docType]: file }));
                          clearDocumentError(docType);
                        }}
                      />
                    ),
                  )}
                </div>
              </AppFormSection>
            </div>
          </div>
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-3">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {tNew("cancel")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            onClick={submit}
            disabled={isPending || optionsLoading || needsR2ForSubmit}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
