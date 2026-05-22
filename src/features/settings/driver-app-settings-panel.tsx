"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resetDriverAppSettings,
  setDriverAppMaintenanceMode,
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
import { cn } from "@/lib/utils";

type DriverAppSettingsPanelProps = {
  driverAppTitle: string;
  driverAppLogoUrl: string | null;
  driverAppSplashUrl: string | null;
  driverAppMaintenanceMode: boolean;
  driverAppMaintenanceMessage: string;
};

export function DriverAppSettingsPanel({
  driverAppTitle,
  driverAppLogoUrl,
  driverAppSplashUrl,
  driverAppMaintenanceMode,
  driverAppMaintenanceMessage,
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
                : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("brandingTitle")}</CardTitle>
          <CardDescription>{t("brandingSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="grid gap-4"
            action={(formData) => {
              startTransition(async () => {
                setError(null);
                const result = await updateDriverAppSettings(locale, formData);
                if (result.error) {
                  setError(result.error);
                  toast.error(errorMessage ?? t("errors.saveFailed"));
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
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Label>{t("logo")}</Label>
              <p className="text-xs text-muted-foreground">{t("logoHint")}</p>
              <div className="flex items-center gap-4">
                {logoDisplay ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoDisplay}
                    alt={driverAppTitle}
                    className="h-14 w-14 rounded-lg border border-border object-contain bg-muted/30 p-1"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
                <Input
                  ref={logoRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={isPending}
                  className="max-w-sm cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="cursor-pointer rounded-lg"
                onClick={() => {
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
              >
                {t("uploadLogo")}
              </Button>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Label>{t("splash")}</Label>
              <p className="text-xs text-muted-foreground">{t("splashHint")}</p>
              <div className="flex flex-wrap items-start gap-4">
                {splashDisplay ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={splashDisplay}
                    alt=""
                    className="h-32 w-[4.5rem] rounded-lg border border-border object-cover bg-muted/30"
                  />
                ) : (
                  <div className="flex h-32 w-[4.5rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                    {t("noImage")}
                  </div>
                )}
                <Input
                  ref={splashRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                  disabled={isPending}
                  className="max-w-sm cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSplashPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="cursor-pointer rounded-lg"
                onClick={() => {
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
              >
                {t("uploadSplash")}
              </Button>
            </div>

            <div className="border-t border-border pt-4">
              <Button type="submit" disabled={isPending} className="cursor-pointer rounded-lg">
                {isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("maintenanceTitle")}</CardTitle>
          <CardDescription>{t("maintenanceSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
              <p className="text-sm text-muted-foreground">
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
                    toast.success(checked ? t("maintenanceEnabled") : t("maintenanceDisabled"));
                    router.refresh();
                  });
                }}
              />
            </div>
          </div>

          <form
            className="space-y-2"
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
            <Label htmlFor="driverAppMaintenanceMessage">{t("maintenanceMessage")}</Label>
            <textarea
              id="driverAppMaintenanceMessage"
              name="driverAppMaintenanceMessage"
              defaultValue={driverAppMaintenanceMessage}
              required
              disabled={isPending}
              rows={3}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            <Button type="submit" variant="outline" disabled={isPending} className="cursor-pointer rounded-lg">
              {isPending ? t("saving") : t("saveMessage")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
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
                if (logoRef.current) logoRef.current.value = "";
                if (splashRef.current) splashRef.current.value = "";
                toast.success(t("resetDone"));
                router.refresh();
              });
            }}
          >
            {t("reset")}
          </Button>
        </CardContent>
      </Card>

      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
