"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { queryKeys } from "@/lib/query/query-keys";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { FormSectionCard } from "@/components/form-section-card";
import { getR2SetupStatus } from "@/features/settings/storage-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@/i18n/navigation";
import { useHasMounted } from "@/hooks/use-has-mounted";
import {
  CIVIL_ID_DIGIT_COUNT,
  KUWAIT_PHONE_DIGIT_COUNT,
  restrictDigits,
} from "./driver-phone";
import { createDriverIntake } from "./drivers-actions";
import { isDriverErrorKey } from "./driver-errors";
import { DriverDocumentUpload } from "./driver-document-upload";
import {
  ASSET_TYPES,
  DOCUMENT_TYPES,
  type DriverAssetType,
  type DriverDocumentType,
} from "./types";
import { DriverRestaurantPicker } from "./driver-restaurant-picker";
import { selectOptions, selectOptionsFrom } from "@/lib/select-items";
import { useDriverFormOptions } from "./use-driver-form-options";
import {
  hasValidationErrors,
  NONE_VEHICLE,
  validateDriverForm,
  type DriverFormErrors,
  type DriverFormField,
} from "./driver-form-validation";
import type { DriverErrorKey } from "./driver-errors";

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

function AddDriverForm() {
  const t = useTranslations("pages.driverNew");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: options, isLoading: optionsLoading } = useDriverFormOptions();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [civilId, setCivilId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [restaurantIds, setRestaurantIds] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [vehicleId, setVehicleId] = useState(NONE_VEHICLE);
  const [assetsEnabled, setAssetsEnabled] = useState(true);
  const [assets, setAssets] = useState<Record<DriverAssetType, boolean>>({
    gps: true,
    sim: true,
    phone: true,
    delivery_bag: true,
    helmet: true,
    uniform: true,
  });
  const [documents, setDocuments] = useState<Record<DriverDocumentType, File | null>>({
    license: null,
    civil_id: null,
    work_permit: null,
    passport: null,
  });
  const [fieldErrors, setFieldErrors] = useState<DriverFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [r2Configured, setR2Configured] = useState(true);

  useEffect(() => {
    void getR2SetupStatus().then((status) => {
      setR2Configured(status.configured);
    });
  }, []);

  const errorMessage = (key?: DriverErrorKey) =>
    key ? t(`errors.${key}`) : undefined;

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
      const k = `document_${docType}` as const;
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  const handleSubmit = () => {
    const validation = validateDriverForm({
      fullName,
      phone,
      civilId,
      partnerId,
      zoneId,
      documents,
    });
    setShowErrors(true);
    setFieldErrors(validation);
    if (hasValidationErrors(validation)) {
      const firstKey = Object.values(validation)[0];
      toast.error(driverErrorToast(t, firstKey));
      return;
    }

    if (needsR2ForSubmit) {
      toast.error(driverErrorToast(t, "r2_not_configured"));
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
      for (const docType of DOCUMENT_TYPES) {
        const file = documents[docType];
        if (file) formData.append(`doc_${docType}`, file);
      }
      for (const rid of restaurantIds) {
        formData.append("restaurantIds", rid);
      }

      const result = await createDriverIntake(formData);
      if (result.error) {
        toast.error(driverErrorToast(t, result.error));
        return;
      }
      if (result.driver_code) {
        toast.success(t("createdWithCode", { code: result.driver_code }));
      } else {
        toast.success(t("created"));
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
      router.push("/drivers");
    });
  };

  const hasDocumentUploads = DOCUMENT_TYPES.some((docType) => documents[docType] != null);
  const needsR2ForSubmit = hasDocumentUploads && !r2Configured;

  const partners = options?.partners ?? [];
  const zones = options?.zones ?? [];
  const vehicles = options?.vehicles ?? [];

  const partnerSelectItems = selectOptionsFrom(
    partners,
    (p) => p.id,
    (p) => p.name,
  );
  const zoneSelectItems = selectOptionsFrom(
    zones,
    (z) => z.id,
    (z) => `${z.name} (${z.code})`,
  );
  const vehicleSelectItems = selectOptions([
    { value: NONE_VEHICLE, label: t("noVehicle") },
    ...vehicles.map((v) => ({
      value: v.id,
      label: `${v.bike_id}${v.reg_number ? ` · ${v.reg_number}` : ""}`,
    })),
  ]);
  const allRestaurants = options?.restaurants ?? [];

  const handlePartnerChange = (nextPartnerId: string) => {
    setPartnerId(nextPartnerId);
    clearFieldError("partnerId");
    if (!nextPartnerId) {
      setRestaurantIds([]);
      return;
    }
    setRestaurantIds((prev) =>
      prev.filter((id) =>
        allRestaurants.some(
          (r) => r.id === id && r.partner_id === nextPartnerId && r.status === "published",
        ),
      ),
    );
  };

  const showFieldError = (field: DriverFormField) =>
    showErrors ? errorMessage(fieldErrors[field]) : undefined;

  const showDocumentError = (docType: DriverDocumentType) =>
    showErrors
      ? errorMessage(fieldErrors[`document_${docType}`])
      : undefined;

  return (
    <AppPage narrow className="pb-10">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer shrink-0"
            nativeButton={false}
            render={<Link href="/drivers" />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
        </div>

        {!r2Configured ? (
          <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2">
              <p>
                {hasDocumentUploads
                  ? t("r2NotConfigured")
                  : t("r2NotConfiguredOptional")}
              </p>
              <Link
                href="/settings/storage"
                className="inline-flex font-medium text-primary hover:underline"
              >
                {t("configureStorage")}
              </Link>
            </div>
          </div>
        ) : null}

        <FormSectionCard title={t("sections.basic")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">{t("fields.fullName")}</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              placeholder={t("placeholders.fullName")}
              aria-invalid={Boolean(showFieldError("fullName"))}
              className="rounded-lg"
            />
            <FieldError message={showFieldError("fullName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("fields.phone")}</Label>
            <Input
              id="phone"
              type="text"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={KUWAIT_PHONE_DIGIT_COUNT}
              value={phone}
              onChange={(e) => {
                setPhone(restrictDigits(e.target.value, KUWAIT_PHONE_DIGIT_COUNT));
                clearFieldError("phone");
              }}
              placeholder={t("placeholders.phone")}
              aria-invalid={Boolean(showFieldError("phone"))}
              aria-describedby="phone-hint"
              className="rounded-lg font-mono tabular-nums tracking-wider"
            />
            <p id="phone-hint" className="text-xs text-muted-foreground">
              {t("hints.phone")}
            </p>
            <FieldError message={showFieldError("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="civil-id">{t("fields.civilId")}</Label>
            <Input
              id="civil-id"
              type="text"
              inputMode="numeric"
              maxLength={CIVIL_ID_DIGIT_COUNT}
              value={civilId}
              onChange={(e) => {
                setCivilId(restrictDigits(e.target.value, CIVIL_ID_DIGIT_COUNT));
                clearFieldError("civilId");
              }}
              placeholder={t("placeholders.civilId")}
              aria-invalid={Boolean(showFieldError("civilId"))}
              aria-describedby="civil-id-hint"
              className="rounded-lg font-mono tabular-nums tracking-wider"
            />
            <p id="civil-id-hint" className="text-xs text-muted-foreground">
              {t("hints.civilId")}
            </p>
            <FieldError message={showFieldError("civilId")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="driver-code">{t("fields.driverCode")}</Label>
            <Input
              id="driver-code"
              readOnly
              value=""
              placeholder={t("placeholders.driverCodeAuto")}
              className="rounded-lg font-mono bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">{t("hints.driverCodeAuto")}</p>
          </div>
        </div>
        </FormSectionCard>

        <FormSectionCard title={t("sections.assignment")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{t("fields.partner")}</Label>
            <Select
              items={partnerSelectItems}
              value={partnerId || null}
              onValueChange={(v) => handlePartnerChange(v ?? "")}
              disabled={optionsLoading || partners.length === 0}
            >
              <SelectTrigger
                className="h-9 w-full cursor-pointer rounded-lg bg-background"
                aria-invalid={Boolean(showFieldError("partnerId"))}
              >
                <SelectValue placeholder={t("placeholders.partner")} />
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
            {!optionsLoading && partners.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                {t("emptyPartners")}{" "}
                <Link href="/partners" className="text-primary hover:underline">
                  {t("addPartnerLink")}
                </Link>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("fields.zone")}</Label>
            <Select
              items={zoneSelectItems}
              value={zoneId || null}
              onValueChange={(v) => {
                setZoneId(v ?? "");
                clearFieldError("zoneId");
              }}
              disabled={optionsLoading || zones.length === 0}
            >
              <SelectTrigger
                className="h-9 w-full cursor-pointer rounded-lg bg-background"
                aria-invalid={Boolean(showFieldError("zoneId"))}
              >
                <SelectValue placeholder={t("placeholders.zone")} />
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
            {!optionsLoading && zones.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                {t("emptyZones")}{" "}
                <Link href="/zones" className="text-primary hover:underline">
                  {t("addZoneLink")}
                </Link>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{t("fields.vehicle")}</Label>
            <Select
              items={vehicleSelectItems}
              value={vehicleId || null}
              onValueChange={(v) => setVehicleId(v ?? NONE_VEHICLE)}
              disabled={optionsLoading}
            >
              <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg bg-background">
                <SelectValue placeholder={t("placeholders.vehicle")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VEHICLE} label={t("noVehicle")}>
                  {t("noVehicle")}
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
        </FormSectionCard>

        <FormSectionCard
          title={t("sections.restaurants")}
          description={t("sections.restaurantsDescription")}
        >
          <DriverRestaurantPicker
            partnerId={partnerId}
            restaurants={allRestaurants}
            selectedIds={restaurantIds}
            onChange={setRestaurantIds}
            disabled={optionsLoading}
          />
        </FormSectionCard>

        <FormSectionCard
          title={t("sections.assets")}
          action={
            <Switch
              checked={assetsEnabled}
              onCheckedChange={setAssetsEnabled}
              aria-label={t("sections.assets")}
            />
          }
        >
        {assetsEnabled ? (
          <div className="flex flex-wrap gap-6">
            {ASSET_TYPES.map((asset) => (
              <label
                key={asset}
                className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
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
                {t(`assets.${asset}`)}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("assetsDisabled")}</p>
        )}
        </FormSectionCard>

        <FormSectionCard
          title={t("sections.documents")}
          description={t("sections.documentsDescription")}
        >
        <div className="grid gap-4 sm:grid-cols-2">
          {DOCUMENT_TYPES.map((docType) => (
            <DriverDocumentUpload
              key={docType}
              docType={docType}
              file={documents[docType]}
              isSubmitting={isPending}
              error={showDocumentError(docType)}
              onChange={(file) => {
                setDocuments((prev) => ({ ...prev, [docType]: file }));
                clearDocumentError(docType);
              }}
            />
          ))}
        </div>
        </FormSectionCard>

        <FormSectionCard title="">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg"
              nativeButton={false}
              render={<Link href="/drivers" />}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="cursor-pointer rounded-lg"
              onClick={handleSubmit}
              disabled={isPending || optionsLoading || needsR2ForSubmit}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("createDriver")
              )}
            </Button>
          </div>
        </FormSectionCard>
    </AppPage>
  );
}

export function AddDriverPageShell() {
  const mounted = useHasMounted();
  if (!mounted) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <AddDriverForm />;
}
