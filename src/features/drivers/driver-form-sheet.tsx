"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { isR2Configured } from "@/lib/storage/r2-config";
import { queryKeys } from "@/lib/query/query-keys";
import { isDriverErrorKey } from "./driver-errors";
import {
  CIVIL_ID_DIGIT_COUNT,
  phoneStorageToDigits,
  restrictDigits,
} from "./driver-phone";
import {
  hasValidationErrors,
  NONE_VEHICLE,
  validateDriverForm,
  type DriverFormErrors,
  type DriverFormField,
} from "./driver-form-validation";
import { createDriverIntake, updateDriverIntake } from "./drivers-actions";
import {
  ASSET_TYPES,
  DOCUMENT_TYPES,
  type DriverAssetType,
  type DriverDetailModel,
  type DriverDocumentType,
  type DriverRemoteDocument,
  type DriverWorkflowStatus,
} from "./types";
import { useDriverFormOptions } from "./use-driver-form-options";
import { DriverFormAssignmentCard } from "./form/driver-form-assignment-card";
import { DriverFormDocumentsGrid } from "./form/driver-form-documents-grid";
import { DriverFormFooter } from "./form/driver-form-footer";
import { DriverFormHeader } from "./form/driver-form-header";
import { DriverFormIdentitySection } from "./form/driver-form-identity-section";
import { DriverFormOperationsCard } from "./form/driver-form-operations-card";
import { useDriverFormCompletion } from "./form/use-driver-form-completion";
import { useDriverFormDraft } from "./form/use-driver-form-draft";
import { useFormSectionSpy } from "./form/use-form-section-spy";
import type { DriverErrorKey } from "./driver-errors";

type DriverFormMode = "create" | "edit";

function hasAnyAssetIssued(assets: Record<string, boolean>): boolean {
  return ASSET_TYPES.some((asset) => Boolean(assets[asset]));
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
  const tDrivers = useTranslations("pages.drivers");
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
  const [assets, setAssets] = useState<Record<DriverAssetType, boolean>>({
    ...EMPTY_ASSETS,
    gps: true,
    sim: true,
    phone: true,
    delivery_bag: false,
    helmet: false,
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
      setAssets({
        ...EMPTY_ASSETS,
        gps: true,
        sim: true,
        phone: true,
        delivery_bag: false,
        helmet: false,
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

  const hasDocumentUploads = DOCUMENT_TYPES.some((docType) => documents[docType] != null);
  const needsR2ForSubmit = (hasDocumentUploads || avatarFile != null) && !r2Ready;

  const saveLabel = isEdit ? tDetail("saveChanges") : tNew("createDriver");
  const titleLabel = isEdit ? tDetail("editTitle") : tNew("title");
  const subtitleLabel = isEdit ? tDetail("editSubtitle") : tNew("subtitle");

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
      formData.append("workflowStatus", workflowStatus);
      if (vehicleId && vehicleId !== NONE_VEHICLE) {
        formData.append("vehicleId", vehicleId);
      }
      formData.append("assetsEnabled", hasAnyAssetIssued(assets) ? "true" : "false");
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

  const completionPercent = useDriverFormCompletion({
    fullName,
    phone,
    civilId,
    partnerId,
    zoneId,
    vehicleId: vehicleId === NONE_VEHICLE ? "" : vehicleId,
    restaurantCount: restaurantIds.length,
    assets,
    documents,
    remoteDocumentCount: Object.keys(remoteDocuments).length,
    hasAvatar: Boolean(avatarPreview || avatarFile),
  });

  const draftPayload = useMemo(
    () => ({
      fullName,
      phone,
      civilId,
      partnerId,
      zoneId,
      vehicleId,
      restaurantIds,
      workflowStatus,
      assets,
    }),
    [
      assets,
      civilId,
      fullName,
      partnerId,
      phone,
      restaurantIds,
      vehicleId,
      workflowStatus,
      zoneId,
    ],
  );
  const { savedAt, clearDraft } = useDriverFormDraft({
    enabled: open && !isEdit,
    key: "driver-form-draft",
    payload: draftPayload,
  });

  useEffect(() => {
    if (!open || isEdit) return;
    const raw = localStorage.getItem("driver-form-draft");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<typeof draftPayload>;
      setFullName(parsed.fullName ?? "");
      setPhone(parsed.phone ?? "");
      setCivilId(parsed.civilId ?? "");
      setPartnerId(parsed.partnerId ?? "");
      setZoneId(parsed.zoneId ?? "");
      setVehicleId(parsed.vehicleId ?? NONE_VEHICLE);
      setRestaurantIds(parsed.restaurantIds ?? []);
      setWorkflowStatus(parsed.workflowStatus ?? "draft");
      if (parsed.assets) {
        setAssets((prev) => ({ ...prev, ...parsed.assets }));
      }
    } catch {
      localStorage.removeItem("driver-form-draft");
    }
    // run once per open cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  const { activeStep, scrollToStep } = useFormSectionSpy({ enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-[min(1440px,94vw)] max-w-[min(1440px,94vw)] flex-col gap-0 overflow-hidden rounded-[18px] p-0"
        showCloseButton
      >
        <DriverFormHeader
          title={titleLabel}
          subtitle={subtitleLabel}
          progressLabel={tNew("stepper.progress")}
          stepLabels={{
            identity: tNew("stepper.identity"),
            assignment: tNew("stepper.assignment"),
            documents: tNew("stepper.documents"),
          }}
          activeStep={activeStep}
          onStepClick={scrollToStep}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            <DriverFormIdentitySection
              fullName={fullName}
              onFullNameChange={(next) => {
                setFullName(next);
                clearFieldError("fullName");
              }}
              phone={phone}
              onPhoneChange={(next) => {
                setPhone(next);
                clearFieldError("phone");
              }}
              civilId={civilId}
              onCivilIdChange={(next) => {
                setCivilId(next);
                clearFieldError("civilId");
              }}
              employeeId={employeeId}
              onEmployeeIdChange={setEmployeeId}
              showEmployeeId={Boolean(isEdit && activeDriver?.linked_profile_id)}
              driverCode={isEdit ? activeDriver?.driver_code ?? "—" : tNew("placeholders.driverCodeAuto")}
              driverCodeHint={tNew("metadata.autoGenerated")}
              labels={{
                section: tNew("stepper.identity"),
                fullName: tNew("fields.fullName"),
                phone: tNew("fields.phone"),
                civilId: tNew("fields.civilId"),
                employeeId: tDrivers("employeeId"),
                driverCode: tNew("fields.driverCode"),
              }}
              placeholders={{
                fullName: tNew("placeholders.fullName"),
                civilId: tNew("placeholders.civilId"),
              }}
              uploadLabel={tNew("uploadPhoto")}
              removeLabel={tNew("removePhoto")}
              avatarHint={tNew("profilePhotoHint")}
              avatarPreview={avatarPreview}
              onAvatarSelect={handleAvatarSelect}
              onAvatarRemove={handleAvatarRemove}
              disabled={isPending}
              errors={{
                fullName: showFieldError("fullName"),
                phone: showFieldError("phone"),
                civilId: showFieldError("civilId"),
              }}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <DriverFormAssignmentCard
                partnerId={partnerId}
                onPartnerChange={(value) => {
                  setPartnerId(value);
                  clearFieldError("partnerId");
                }}
                zoneId={zoneId}
                onZoneChange={(value) => {
                  setZoneId(value);
                  clearFieldError("zoneId");
                }}
                vehicleId={vehicleId || NONE_VEHICLE}
                onVehicleChange={setVehicleId}
                restaurants={allRestaurants}
                selectedRestaurantIds={restaurantIds}
                onRestaurantsChange={setRestaurantIds}
                partners={partners}
                zones={zones}
                vehicles={vehicles}
                disabled={optionsLoading || isPending}
                errors={{
                  partnerId: showFieldError("partnerId"),
                  zoneId: showFieldError("zoneId"),
                }}
                noVehicleLabel={tNew("noVehicle")}
                placeholderPartner={tNew("placeholders.partner")}
                placeholderZone={tNew("placeholders.zone")}
                placeholderVehicle={tNew("placeholders.vehicle")}
                labels={{
                  section: tNew("stepper.assignment"),
                  partner: tNew("fields.partner"),
                  zone: tNew("fields.zone"),
                  vehicle: tNew("fields.vehicle"),
                  restaurants: tNew("sections.restaurants"),
                }}
              />

              <DriverFormOperationsCard
                workflowStatus={workflowStatus}
                onWorkflowStatusChange={setWorkflowStatus}
                assets={assets}
                onToggleAsset={(asset) =>
                  setAssets((prev) => ({ ...prev, [asset]: !prev[asset] }))
                }
                assetLabels={{
                  gps: tNew("assets.gps"),
                  sim: tNew("assets.sim"),
                  phone: tNew("assets.phone"),
                  delivery_bag: tNew("assets.delivery_bag"),
                  helmet: tNew("assets.helmet"),
                  uniform: tNew("assets.uniform"),
                }}
                labels={{
                  section: tNew("sections.operations"),
                  status: tNew("sections.driverStatus"),
                  assets: tNew("sections.assets"),
                  active: tNew("status.active"),
                  inactive: tNew("status.inactive"),
                }}
                disabled={isPending}
              />
            </div>

            <DriverFormDocumentsGrid
              isEdit={isEdit}
              disabled={isPending}
              intakeId={intakeId ?? ""}
              driverProfileId={activeDriver?.linked_profile_id ?? null}
              documents={documents}
              errors={{
                license: showDocumentError("license"),
                civil_id: showDocumentError("civil_id"),
                work_permit: showDocumentError("work_permit"),
                passport: showDocumentError("passport"),
              }}
              remoteDocuments={remoteDocuments}
              sectionLabel={tNew("stepper.documents")}
              onInlineChange={(docType, file) => {
                setDocuments((prev) => ({ ...prev, [docType]: file }));
                clearDocumentError(docType);
              }}
              onRemoteChange={(docType, next) => {
                if (!activeDriver) return;
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
          </div>
        </div>
        <DriverFormFooter
          completionPercent={completionPercent}
          savedAtLabel={
            savedAt
              ? tNew("footer.draftSaved", { time: savedAt.toLocaleTimeString() })
              : tNew("footer.profileComplete", { percent: completionPercent })
          }
          saveLabel={saveLabel}
          cancelLabel={tNew("cancel")}
          disabled={optionsLoading || needsR2ForSubmit}
          pending={isPending}
          onCancel={() => {
            if (!isEdit) clearDraft();
            onOpenChange(false);
          }}
          onSave={submit}
        />
      </DialogContent>
    </Dialog>
  );
}
