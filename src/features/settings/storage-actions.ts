"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/get-session";
import {
  invalidateR2ConfigCache,
  maskSecret,
  resolveR2Config,
} from "@/lib/storage/r2-config";
import { testR2Connection } from "@/lib/storage/r2-client";

async function requireSuperAdmin() {
  const session = await getSessionUser();
  if (!session?.isSuperAdmin) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

export type StorageSettingsView = {
  accountId: string;
  accessKeyId: string;
  bucketName: string;
  s3Endpoint: string;
  hasSecret: boolean;
  accessKeyMasked: string;
  secretMasked: string;
  configured: boolean;
  source: "env" | "database" | "none";
};

export async function getStorageSettings(): Promise<
  StorageSettingsView | { error: string }
> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  const envAccount = process.env.R2_ACCOUNT_ID?.trim();
  const envKey = process.env.R2_ACCESS_KEY_ID?.trim();
  const envSecret = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const envBucket = process.env.R2_BUCKET_NAME?.trim();
  const envEndpoint = process.env.R2_S3_ENDPOINT?.trim();

  if (envAccount && envKey && envSecret && envBucket) {
    return {
      accountId: envAccount,
      accessKeyId: envKey,
      bucketName: envBucket,
      s3Endpoint:
        envEndpoint || `https://${envAccount}.r2.cloudflarestorage.com`,
      hasSecret: true,
      accessKeyMasked: maskSecret(envKey),
      secretMasked: maskSecret(envSecret),
      configured: true,
      source: "env",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("storage_config")
    .select(
      "r2_account_id, r2_access_key_id, r2_secret_access_key, r2_bucket_name, r2_s3_endpoint",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) return { error: "load_failed" };

  const accountId = data?.r2_account_id?.trim() ?? "";
  const accessKeyId = data?.r2_access_key_id?.trim() ?? "";
  const secret = data?.r2_secret_access_key?.trim() ?? "";
  const bucketName = data?.r2_bucket_name?.trim() ?? "";
  const s3Endpoint =
    data?.r2_s3_endpoint?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  const configured = Boolean(
    accountId && accessKeyId && secret && bucketName,
  );

  return {
    accountId,
    accessKeyId,
    bucketName,
    s3Endpoint,
    hasSecret: Boolean(secret),
    accessKeyMasked: maskSecret(accessKeyId),
    secretMasked: maskSecret(secret),
    configured,
    source: configured ? "database" : "none",
  };
}

export async function saveStorageSettings(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  const accountId = String(formData.get("accountId") ?? "").trim();
  const accessKeyId = String(formData.get("accessKeyId") ?? "").trim();
  const secretAccessKey = String(formData.get("secretAccessKey") ?? "").trim();
  const bucketName = String(formData.get("bucketName") ?? "").trim();
  const s3Endpoint = String(formData.get("s3Endpoint") ?? "").trim();

  if (!accountId || !accessKeyId || !bucketName) {
    return { error: "missing_fields" };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("storage_config")
    .select("r2_secret_access_key, r2_access_key_id")
    .eq("id", 1)
    .maybeSingle();

  const finalSecret =
    secretAccessKey || existing?.r2_secret_access_key?.trim() || "";
  const finalAccessKey =
    accessKeyId || existing?.r2_access_key_id?.trim() || "";

  if (!finalSecret || !finalAccessKey) {
    return { error: "missing_secret" };
  }

  const { error } = await admin.from("storage_config").upsert({
    id: 1,
    r2_account_id: accountId,
    r2_access_key_id: finalAccessKey,
    r2_secret_access_key: finalSecret,
    r2_bucket_name: bucketName,
    r2_s3_endpoint: s3Endpoint || null,
    updated_at: new Date().toISOString(),
    updated_by: auth.session.id,
  });

  if (error) return { error: "save_failed" };

  invalidateR2ConfigCache();
  return { success: true };
}

export async function testStorageConnection(): Promise<{
  ok?: boolean;
  error?: string;
}> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  try {
    invalidateR2ConfigCache();
    await resolveR2Config();
    const result = await testR2Connection();
    if (!result.ok) return { error: result.error ?? "connection_failed" };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "connection_failed";
    return { error: message };
  }
}

export async function getR2SetupStatus(): Promise<{
  configured: boolean;
  source?: "env" | "database";
}> {
  try {
    const config = await resolveR2Config();
    return { configured: true, source: config.source };
  } catch {
    return { configured: false };
  }
}
