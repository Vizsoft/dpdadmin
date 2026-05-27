"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  validateAvatarFile,
  type DriverFormErrors,
  type DriverFormField,
} from "./driver-form-validation";
import { createDriverIntake, getDriverUploadStorageStatus, updateDriverIntake } from "./drivers-actions";
import {
  DOCUMENT_TYPES,
  type DriverDetailModel,
  type DriverDocumentType,
  type DriverRemoteDocument,
  type DriverWorkflowStatus,
} from "./types";
import { useDriverDocuments } from "./use-drivers";
import { useDriverFormOptions } from "./use-driver-form-options";
import { useDriverFormAssetCatalog } from "@/features/assets/use-assets";
import { DriverFormAssignmentCard } from "./form/driver-form-assignment-card";
import { DriverFormDocumentsGrid } from "./form/driver-form-documents-grid";
import { DriverFormFooter } from "./form/driver-form-footer";
import { DriverFormIdentitySection } from "./form/driver-form-identity-section";
import { DriverFormOperationsCard } from "./form/driver-form-operations-card";
import { useDriverFormDraft } from "./form/use-driver-form-draft";
import type { DriverErrorKey } from "./driver-errors";

type DriverFormMode = "create" | "edit";

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
  const intakeIdForDocs = isEdit ? (intakeId ?? activeDriver?.intake_id ?? "") : "";
  const { data: fetchedDocuments } = useDriverDocuments(
    intakeIdForDocs,
    activeDriver?.linked_profile_id ?? null,
    open && isEdit && Boolean(intakeIdForDocs),
  );
  const { data: assetCatalog = [], isLoading: assetCatalogLoading } = useDriverFormAssetCatalog(
    isEdit ? intakeIdForDocs || null : null,
    open,
  );

  useEffect(() => {
    if (!open || assetCatalogLoading || !isEdit) return;
    setSelectedCatalogIds(
      new Set(assetCatalog.filter((item) => item.is_selected).map((item) => item.id)),
    );
  }, [open, isEdit, assetCatalogLoading, assetCatalog]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [civilId, setCivilId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [vehicleId, setVehicleId] = useState(NONE_VEHICLE);
  const [workflowStatus, setWorkflowStatus] = useState<DriverWorkflowStatus>("draft");
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(new Set());
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
    if (!open) return;
    void getDriverUploadStorageStatus()
      .then(({ r2Configured }) => setR2Ready(r2Configured))
      .catch(() => setR2Ready(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      if (!activeDriver) return;
      setFullName(activeDriver.full_name);
      setPhone(phoneStorageToDigits(activeDriver.phone));
      setCivilId(restrictDigits(activeDriver.civil_id, CIVIL_ID_DIGIT_COUNT));
      setEmployeeId(activeDriver.employee_id ?? "");
      setPartnerId(activeDriver.partner_id ?? "");
      setRestaurantIds(activeDriver.restaurant_ids);
      setZoneId(activeDriver.zone_id ?? "");
      setVehicleId(activeDriver.vehicle_id ?? NONE_VEHICLE);
      setWorkflowStatus(activeDriver.workflow_status);
      setDocuments(EMPTY_DOCS);
      setRemoteDocuments({});
      setAvatarPreview(activeDriver.avatar_url ?? null);
      return;
    }
    if (!isEdit) {
      setFullName("");
      setPhone("");
      setCivilId("");
      setEmployeeId("");
      setPartnerId("");
      setRestaurantIds([]);
      setZoneId("");
      setVehicleId(NONE_VEHICLE);
      setWorkflowStatus("draft");
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
    if (!open || !isEdit || !fetchedDocuments) return;
    setRemoteDocuments(fetchedDocuments);
  }, [open, isEdit, fetchedDocuments]);

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
    const avatarError = validateAvatarFile(file);
    if (avatarError) {
      toast.error(driverErrorToast(tNew, avatarError));
      return;
    }
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
      employeeId,
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
      formData.append("employeeId", employeeId);
      formData.append("partnerId", partnerId);
      formData.append("zoneId", zoneId);
      formData.append("workflowStatus", workflowStatus);
      if (vehicleId && vehicleId !== NONE_VEHICLE) {
        formData.append("vehicleId", vehicleId);
      }
      for (const catalogItemId of selectedCatalogIds) {
        formData.append("catalogItemIds", catalogItemId);
      }
      for (const rid of restaurantIds) {
        formData.append("restaurantIds", rid);
      }
      if (avatarFile) formData.append("avatar", avatarFile);
      if (removeAvatar) formData.append("removeAvatar", "true");

      if (isEdit && activeDriver && intakeId) {
        formData.append("intakeId", intakeId);
        const result = await updateDriverIntake(formData);
        if (result.error) {
          toast.error(driverErrorToast(tNew, result.error));
          return;
        }
        toast.success(tDetail("updated"));
        void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
        void queryClient.invalidateQueries({
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
        void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
      }

      onSaved?.();
      onOpenChange(false);
    });
  };

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
      catalogItemIds: [...selectedCatalogIds],
    }),
    [
      selectedCatalogIds,
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
      if (Array.isArray(parsed.catalogItemIds)) {
        setSelectedCatalogIds(new Set(parsed.catalogItemIds.filter(Boolean)));
      }
    } catch {
      localStorage.removeItem("driver-form-draft");
    }
    // run once per open cycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit]);

  const isLoadingEdit = isEdit && open && !activeDriver;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-[min(1200px,96vw)] max-w-[min(1200px,96vw)] flex-col gap-0 overflow-visible rounded-xl p-0"
        showCloseButton
        closeOutside
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-3">
          {isLoadingEdit ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
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
              onEmployeeIdChange={(next) => {
                setEmployeeId(next);
                clearFieldError("employeeId");
              }}
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

            <div className="grid gap-3 lg:grid-cols-2 lg:items-stretch">
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
                catalogItems={assetCatalog}
                selectedCatalogIds={selectedCatalogIds}
                onToggleCatalogItem={(catalogItemId) =>
                  setSelectedCatalogIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(catalogItemId)) next.delete(catalogItemId);
                    else next.add(catalogItemId);
                    return next;
                  })
                }
                labels={{
                  section: tNew("sections.operations"),
                  status: tNew("sections.driverStatus"),
                  assets: tNew("sections.assets"),
                  active: tNew("status.active"),
                  inactive: tNew("status.inactive"),
                }}
                catalogLoading={assetCatalogLoading}
                emptyCatalogHint={tNew("assetsCatalogEmpty")}
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
          )}
        </div>
        <DriverFormFooter
          title={titleLabel}
          subtitle={subtitleLabel}
          savedAtLabel={
            savedAt && !isEdit
              ? tNew("footer.draftSaved", { time: savedAt.toLocaleTimeString() })
              : undefined
          }
          saveLabel={saveLabel}
          cancelLabel={tNew("cancel")}
          disabled={optionsLoading || needsR2ForSubmit || isLoadingEdit}
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
