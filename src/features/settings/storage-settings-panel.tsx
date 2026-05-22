"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Cloud, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSectionCard } from "@/components/form-section-card";
import {
  getStorageSettings,
  saveCloudflareApiToken,
  saveStorageSettings,
  testStorageConnection,
  verifyCloudflareApiToken,
  type StorageSettingsView,
} from "@/features/settings/storage-actions";

export function StorageSettingsPanel() {
  const t = useTranslations("pages.settings.storage");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StorageSettingsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastProbeKey, setLastProbeKey] = useState<string | null>(null);

  const [cloudflareApiToken, setCloudflareApiToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");

  const refreshSettings = async () => {
    const result = await getStorageSettings();
    if (!("error" in result)) {
      setSettings(result);
      setAccountId(result.accountId);
      setAccessKeyId(result.accessKeyId);
      setBucketName(result.bucketName);
      setS3Endpoint(result.s3Endpoint);
    }
    return result;
  };

  useEffect(() => {
    void refreshSettings().then((result) => {
      setLoading(false);
      if ("error" in result) {
        setError(result.error);
      }
    });
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.append("accountId", accountId);
      formData.append("accessKeyId", accessKeyId);
      formData.append("secretAccessKey", secretAccessKey);
      formData.append("bucketName", bucketName);
      formData.append("s3Endpoint", s3Endpoint);
      if (cloudflareApiToken) {
        formData.append("cloudflareApiToken", cloudflareApiToken);
      }

      const result = await saveStorageSettings(formData);
      if (result.error) {
        setError(result.error);
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("saved"));
      setSecretAccessKey("");
      setCloudflareApiToken("");
      await refreshSettings();
    });
  };

  const handleSaveCloudflareToken = () => {
    startTransition(async () => {
      const result = await saveCloudflareApiToken(cloudflareApiToken);
      if (result.error) {
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("cloudflareTokenSaved"));
      setCloudflareApiToken("");
      await refreshSettings();
    });
  };

  const handleVerifyToken = () => {
    startTransition(async () => {
      if (cloudflareApiToken.trim()) {
        const saveResult = await saveCloudflareApiToken(cloudflareApiToken);
        if (saveResult.error) {
          toast.error(t(`errors.${saveResult.error}`));
          return;
        }
        setCloudflareApiToken("");
        await refreshSettings();
      }

      const result = await verifyCloudflareApiToken();
      if (result.ok) {
        toast.success(
          t("verifyTokenSuccess", { status: result.status ?? result.message ?? "active" }),
        );
        return;
      }
      const errKey = result.error;
      if (errKey && errKey in { missing_cloudflare_token: 1, verify_failed: 1 }) {
        toast.error(t(`errors.${errKey}`));
      } else {
        toast.error(result.error ?? t("verifyTokenFailed"));
      }
    });
  };

  const handleTest = () => {
    startTransition(async () => {
      setLastProbeKey(null);
      const result = await testStorageConnection();
      if (result.ok) {
        if (result.key) setLastProbeKey(result.key);
        toast.success(
          result.key
            ? t("testSuccessDetail", { key: result.key })
            : t("testSuccess"),
        );
        return;
      }
      const errKey = result.error;
      if (
        errKey &&
        (errKey === "missing_r2_s3_credentials" ||
          errKey === "connection_failed" ||
          errKey === "missing_secret")
      ) {
        toast.error(t(`errors.${errKey}`));
      } else {
        toast.error(result.error ?? t("errors.connection_failed"));
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const envLocked = settings?.source === "env";
  const cfTokenEnvLocked = settings?.cloudflareTokenSource === "env";
  const canTestR2 = settings?.configured && !envLocked;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Cloud className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <FormSectionCard title={t("howToTitle")} description={t("howToDescription")}>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{t("steps.createBucket")}</li>
          <li>{t("steps.createToken")}</li>
          <li>{t("steps.fillForm")}</li>
        </ol>
        <a
          href="https://dash.cloudflare.com/?to=/:account/r2/overview"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t("openCloudflare")}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </FormSectionCard>

      {envLocked ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          {t("envOverride")}
        </div>
      ) : null}

      <FormSectionCard
        title={t("cloudflareTokenTitle")}
        description={t("cloudflareTokenDescription")}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-api-token">{t("cloudflareTokenField")}</Label>
            <Input
              id="cf-api-token"
              type="password"
              value={cloudflareApiToken}
              onChange={(e) => setCloudflareApiToken(e.target.value)}
              placeholder={t("cloudflareTokenPlaceholder")}
              disabled={isPending || cfTokenEnvLocked}
              className="rounded-lg font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {settings?.hasCloudflareToken
                ? t("cloudflareTokenHintKeep", {
                    masked: settings.cloudflareTokenMasked,
                  })
                : t("cloudflareTokenHint")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-lg"
              disabled={
                isPending ||
                cfTokenEnvLocked ||
                (!cloudflareApiToken.trim() && !settings?.hasCloudflareToken)
              }
              onClick={handleVerifyToken}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("verifyToken")
              )}
            </Button>
            {!cfTokenEnvLocked && cloudflareApiToken.trim() ? (
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer rounded-lg"
                disabled={isPending}
                onClick={handleSaveCloudflareToken}
              >
                {t("saveCloudflareToken")}
              </Button>
            ) : null}
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard
        title={t("credentialsTitle")}
        description={t("credentialsDescription")}
      >
        {!settings?.configured ? (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{t("r2S3CalloutTitle")}</p>
            <p className="mt-1 text-muted-foreground">
              {t("r2S3Callout", { bucket: bucketName || "dpd-private" })}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="r2-account-id">{t("fields.accountId")}</Label>
            <Input
              id="r2-account-id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="b7723707360cee894c723e0f9d0439df"
              disabled={isPending || envLocked}
              className="rounded-lg font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="r2-access-key">{t("fields.accessKeyId")}</Label>
            <Input
              id="r2-access-key"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              placeholder={settings?.accessKeyMasked || t("fields.accessKeyPlaceholder")}
              disabled={isPending || envLocked}
              className="rounded-lg font-mono text-sm"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="r2-secret">{t("fields.secretAccessKey")}</Label>
            <Input
              id="r2-secret"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder={
                settings?.hasSecret
                  ? t("fields.secretPlaceholderKeep")
                  : t("fields.secretPlaceholder")
              }
              disabled={isPending || envLocked}
              className="rounded-lg font-mono text-sm"
              autoComplete="new-password"
            />
            {settings?.hasSecret ? (
              <p className="text-[11px] text-muted-foreground">
                {t("secretHint", { masked: settings.secretMasked })}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r2-bucket">{t("fields.bucketName")}</Label>
            <Input
              id="r2-bucket"
              value={bucketName}
              onChange={(e) => setBucketName(e.target.value)}
              placeholder="dpd-private"
              disabled={isPending || envLocked}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r2-endpoint">{t("fields.s3Endpoint")}</Label>
            <Input
              id="r2-endpoint"
              value={s3Endpoint}
              onChange={(e) => setS3Endpoint(e.target.value)}
              placeholder="https://….r2.cloudflarestorage.com"
              disabled={isPending || envLocked}
              className="rounded-lg font-mono text-xs"
            />
          </div>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {t(`errors.${error}`)}
          </p>
        ) : null}

        {lastProbeKey ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("probeResult", { key: lastProbeKey })}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            disabled={isPending || !canTestR2}
            onClick={handleTest}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("testConnection")}
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            disabled={isPending || envLocked}
            onClick={handleSave}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
          </Button>
        </div>
      </FormSectionCard>
    </div>
  );
}
