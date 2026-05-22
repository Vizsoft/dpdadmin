"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resetDriverAppSettings,
  setDriverAppMaintenanceMode,
  updateDriverAppDeliveryProximity,
  updateDriverAppMaintenanceMessage,
  updateDriverAppSettings,
  uploadDriverAppLogo,
  uploadDriverAppSplash,
} from "@/features/settings/driver-app-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MAX_DELIVERY_PROXIMITY_METERS,
  MIN_DELIVERY_PROXIMITY_METERS,
  DEFAULT_DRIVER_APP_SETTINGS,
} from "@/lib/branding/constants";
import { cn } from "@/lib/utils";

type DriverAppSettingsPanelProps = {
  driverAppTitle: string;
  driverAppLogoUrl: string | null;
  driverAppSplashUrl: string | null;
  driverAppMaintenanceMode: boolean;
  driverAppMaintenanceMessage: string;
  driverAppDeliveryProximityMeters: number;
};

function AssetUploadBlock({
  label,
  hint,
  previewUrl,
  placeholder,
  fileRef,
  accept,
  uploadLabel,
  disabled,
  previewClassName,
  onFileChange,
  onUpload,
}: {
  label: string;
  hint: string;
  previewUrl: string | null;
  placeholder: string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  accept: string;
  uploadLabel: string;
  disabled: boolean;
  previewClassName: string;
  onFileChange: (file: File) => void;
  onUpload: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt=""
            className={cn("shrink-0 rounded-lg border border-border bg-muted/30", previewClassName)}
          />
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground",
              previewClassName,
            )}
          >
            {placeholder}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            ref={fileRef}
            type="file"
            accept={accept}
            disabled={disabled}
            className="cursor-pointer"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileChange(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="w-fit cursor-pointer rounded-lg"
            onClick={onUpload}
          >
            {uploadLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DriverAppSettingsPanel({
  driverAppTitle,
  driverAppLogoUrl,
  driverAppSplashUrl,
  driverAppMaintenanceMode,
  driverAppMaintenanceMessage,
  driverAppDeliveryProximityMeters,
}: DriverAppSettingsPanelProps) {
  const t = useTranslations("pages.settings.driverApp");
  const locale = useLocale();
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const splashRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [splashPreview, setSplashPreview] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(driverAppMaintenanceMode);
  const [proximityMeters, setProximityMeters] = useState(
    String(driverAppDeliveryProximityMeters),
  );
  const [isPending, startTransition] = useTransition();

  const logoDisplay = logoPreview ?? driverAppLogoUrl;
  const splashDisplay = splashPreview ?? driverAppSplashUrl;

  const errorMessage =
    error === "missing_fields"
      ? t("errors.missingFields")
      : error === "missing_file"
        ? t("errors.missingFile")
        : error === "file_too_large"
          ? t("errors.fileTooLarge")
          : error === "invalid_type"
            ? t("errors.invalidType")
            : error === "upload_failed" || error === "save_failed"
              ? t("errors.saveFailed")
              : error === "not_authorized"
                ? t("errors.notAuthorized")
                : error === "invalid_proximity"
                  ? t("errors.invalidProximity")
                  : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("brandingTitle")}</CardTitle>
          <CardDescription>{t("brandingSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(formData) => {
              startTransition(async () => {
                setError(null);
                const result = await updateDriverAppSettings(locale, formData);
                if (result.error) {
                  setError(result.error);
                  toast.error(t("errors.saveFailed"));
                  return;
                }
                toast.success(t("saved"));
                router.refresh();
              });
            }}
          >
            <input
              type="hidden"
              name="driverAppMaintenanceMessage"
              value={driverAppMaintenanceMessage}
            />
            <div className="space-y-2">
              <Label htmlFor="driverAppTitle">{t("appTitle")}</Label>
              <Input
                id="driverAppTitle"
                name="driverAppTitle"
                defaultValue={driverAppTitle}
                required
                disabled={isPending}
                className="sm:max-w-md"
              />
            </div>

            <div className="grid gap-6 border-t border-border pt-4 sm:grid-cols-2">
              <AssetUploadBlock
                label={t("logo")}
                hint={t("logoHint")}
                previewUrl={logoDisplay}
                placeholder={t("noImage")}
                fileRef={logoRef}
                accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                uploadLabel={t("uploadLogo")}
                disabled={isPending}
                previewClassName="h-14 w-14 object-contain p-1"
                onFileChange={(file) => setLogoPreview(URL.createObjectURL(file))}
                onUpload={() => {
                  const file = logoRef.current?.files?.[0];
                  if (!file) {
                    setError("missing_file");
                    return;
                  }
                  startTransition(async () => {
                    setError(null);
                    const formData = new FormData();
                    formData.append("logo", file);
                    const result = await uploadDriverAppLogo(locale, formData);
                    if (result.error) {
                      setError(result.error);
                      toast.error(t("errors.saveFailed"));
                      return;
                    }
                    if (result.logoUrl) setLogoPreview(result.logoUrl);
                    if (logoRef.current) logoRef.current.value = "";
                    toast.success(t("logoUploaded"));
                    router.refresh();
                  });
                }}
              />
              <AssetUploadBlock
                label={t("splash")}
                hint={t("splashHint")}
                previewUrl={splashDisplay}
                placeholder={t("noImage")}
                fileRef={splashRef}
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                uploadLabel={t("uploadSplash")}
                disabled={isPending}
                previewClassName="h-24 w-14 object-cover"
                onFileChange={(file) => setSplashPreview(URL.createObjectURL(file))}
                onUpload={() => {
                  const file = splashRef.current?.files?.[0];
                  if (!file) {
                    setError("missing_file");
                    return;
                  }
                  startTransition(async () => {
                    setError(null);
                    const formData = new FormData();
                    formData.append("splash", file);
                    const result = await uploadDriverAppSplash(locale, formData);
                    if (result.error) {
                      setError(result.error);
                      toast.error(t("errors.saveFailed"));
                      return;
                    }
                    if (result.splashUrl) setSplashPreview(result.splashUrl);
                    if (splashRef.current) splashRef.current.value = "";
                    toast.success(t("splashUploaded"));
                    router.refresh();
                  });
                }}
              />
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={isPending} className="cursor-pointer rounded-lg">
                {isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("deliveryProximityTitle")}</CardTitle>
          <CardDescription>{t("deliveryProximitySubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = Number(proximityMeters);
              startTransition(async () => {
                setError(null);
                const result = await updateDriverAppDeliveryProximity(locale, parsed);
                if (result.error) {
                  setError(result.error);
                  toast.error(
                    result.error === "invalid_proximity"
                      ? t("errors.invalidProximity")
                      : t("errors.saveFailed"),
                  );
                  return;
                }
                toast.success(t("deliveryProximitySaved"));
                router.refresh();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="driverAppDeliveryProximity">{t("deliveryProximityLabel")}</Label>
              <p className="text-xs text-muted-foreground">{t("deliveryProximityHint")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="driverAppDeliveryProximity"
                  type="number"
                  min={MIN_DELIVERY_PROXIMITY_METERS}
                  max={MAX_DELIVERY_PROXIMITY_METERS}
                  step={1}
                  value={proximityMeters}
                  onChange={(e) => setProximityMeters(e.target.value)}
                  disabled={isPending}
                  className="w-28 tabular-nums"
                  required
                />
                <span className="text-sm text-muted-foreground">{t("deliveryProximityUnit")}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("deliveryProximityDisabledHint")}</p>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={isPending} className="cursor-pointer rounded-lg">
                {isPending ? t("saving") : t("saveDeliveryProximity")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("maintenanceTitle")}</CardTitle>
          <CardDescription>{t("maintenanceSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  maintenanceMode
                    ? "bg-destructive/15 text-destructive"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                )}
              >
                {maintenanceMode ? t("statusMaintenance") : t("statusLive")}
              </span>
              <p className="text-xs text-muted-foreground">
                {maintenanceMode ? t("maintenanceOnHint") : t("maintenanceOffHint")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="driverAppMaintenance" className="text-sm">
                {t("maintenanceToggle")}
              </Label>
              <Switch
                id="driverAppMaintenance"
                checked={maintenanceMode}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  startTransition(async () => {
                    setError(null);
                    const result = await setDriverAppMaintenanceMode(checked);
                    if (result.error) {
                      toast.error(t("errors.saveFailed"));
                      return;
                    }
                    setMaintenanceMode(checked);
                    toast.success(
                      checked ? t("maintenanceEnabled") : t("maintenanceDisabled"),
                    );
                    router.refresh();
                  });
                }}
              />
            </div>
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            action={(formData) => {
              startTransition(async () => {
                setError(null);
                const message = String(formData.get("driverAppMaintenanceMessage") ?? "");
                const result = await updateDriverAppMaintenanceMessage(locale, message);
                if (result.error) {
                  setError(result.error);
                  toast.error(t("errors.saveFailed"));
                  return;
                }
                toast.success(t("messageSaved"));
                router.refresh();
              });
            }}
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="driverAppMaintenanceMessage">{t("maintenanceMessage")}</Label>
              <textarea
                id="driverAppMaintenanceMessage"
                name="driverAppMaintenanceMessage"
                defaultValue={driverAppMaintenanceMessage}
                required
                disabled={isPending}
                rows={2}
                className="flex min-h-[56px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              className="shrink-0 cursor-pointer rounded-lg sm:mb-0"
            >
              {isPending ? t("saving") : t("saveMessage")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        className="cursor-pointer text-destructive hover:text-destructive"
        onClick={() => {
          if (!window.confirm(t("resetConfirm"))) return;
          startTransition(async () => {
            setError(null);
            const result = await resetDriverAppSettings(locale);
            if (result.error) {
              setError(result.error);
              toast.error(t("errors.saveFailed"));
              return;
            }
            setLogoPreview(null);
            setSplashPreview(null);
            setMaintenanceMode(false);
            setProximityMeters(
              String(DEFAULT_DRIVER_APP_SETTINGS.driver_app_delivery_proximity_meters),
            );
            if (logoRef.current) logoRef.current.value = "";
            if (splashRef.current) splashRef.current.value = "";
            toast.success(t("resetDone"));
            router.refresh();
          });
        }}
      >
        {t("reset")}
      </Button>

      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
