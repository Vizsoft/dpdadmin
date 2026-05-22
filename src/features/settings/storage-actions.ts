"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/get-session";
import {
  invalidateR2ConfigCache,
  maskSecret,
  resolveR2Config,
} from "@/lib/storage/r2-config";
import { runR2StorageProbe } from "@/lib/storage/r2-client";

async function requireSuperAdmin() {
  const session = await getSessionUser();
  if (!session?.isSuperAdmin) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

async function resolveCloudflareApiToken(): Promise<string | null> {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const admin = createAdminClient();
  const { data } = await admin
    .from("storage_config")
    .select("cloudflare_api_token")
    .eq("id", 1)
    .maybeSingle();

  return data?.cloudflare_api_token?.trim() || null;
}

export type StorageSettingsView = {
  accountId: string;
  accessKeyId: string;
  bucketName: string;
  s3Endpoint: string;
  hasSecret: boolean;
  accessKeyMasked: string;
  secretMasked: string;
  hasCloudflareToken: boolean;
  cloudflareTokenMasked: string;
  cloudflareTokenSource: "env" | "database" | "none";
  configured: boolean;
  source: "env" | "database" | "none";
};

function buildStorageView(params: {
  accountId: string;
  accessKeyId: string;
  secret: string;
  bucketName: string;
  s3Endpoint: string;
  cloudflareToken: string;
  cloudflareTokenSource: "env" | "database" | "none";
  source: "env" | "database" | "none";
}): StorageSettingsView {
  const configured = Boolean(
    params.accountId &&
      params.accessKeyId &&
      params.secret &&
      params.bucketName,
  );

  return {
    accountId: params.accountId,
    accessKeyId: params.accessKeyId,
    bucketName: params.bucketName,
    s3Endpoint: params.s3Endpoint,
    hasSecret: Boolean(params.secret),
    accessKeyMasked: maskSecret(params.accessKeyId),
    secretMasked: maskSecret(params.secret),
    hasCloudflareToken: Boolean(params.cloudflareToken),
    cloudflareTokenMasked: maskSecret(params.cloudflareToken),
    cloudflareTokenSource: params.cloudflareTokenSource,
    configured,
    source: params.source,
  };
}

export async function getStorageSettings(): Promise<
  StorageSettingsView | { error: string }
> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  const envCfToken = process.env.CLOUDFLARE_API_TOKEN?.trim() ?? "";
  const envAccount = process.env.R2_ACCOUNT_ID?.trim();
  const envKey = process.env.R2_ACCESS_KEY_ID?.trim();
  const envSecret = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const envBucket = process.env.R2_BUCKET_NAME?.trim();
  const envEndpoint = process.env.R2_S3_ENDPOINT?.trim();

  if (envAccount && envKey && envSecret && envBucket) {
    return buildStorageView({
      accountId: envAccount,
      accessKeyId: envKey,
      secret: envSecret,
      bucketName: envBucket,
      s3Endpoint:
        envEndpoint || `https://${envAccount}.r2.cloudflarestorage.com`,
      cloudflareToken: envCfToken,
      cloudflareTokenSource: envCfToken ? "env" : "none",
      source: "env",
    });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("storage_config")
    .select(
      "r2_account_id, r2_access_key_id, r2_secret_access_key, r2_bucket_name, r2_s3_endpoint, cloudflare_api_token",
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
  const dbCfToken = data?.cloudflare_api_token?.trim() ?? "";
  const cloudflareToken = envCfToken || dbCfToken;

  return buildStorageView({
    accountId,
    accessKeyId,
    secret,
    bucketName,
    s3Endpoint,
    cloudflareToken,
    cloudflareTokenSource: envCfToken
      ? "env"
      : dbCfToken
        ? "database"
        : "none",
    source:
      accountId && accessKeyId && secret && bucketName ? "database" : "none",
  });
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
  const cloudflareApiToken = String(formData.get("cloudflareApiToken") ?? "").trim();

  if (!accountId || !accessKeyId || !bucketName) {
    return { error: "missing_fields" };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("storage_config")
    .select(
      "r2_secret_access_key, r2_access_key_id, cloudflare_api_token",
    )
    .eq("id", 1)
    .maybeSingle();

  const finalSecret =
    secretAccessKey || existing?.r2_secret_access_key?.trim() || "";
  const finalAccessKey =
    accessKeyId || existing?.r2_access_key_id?.trim() || "";
  const finalCfToken =
    cloudflareApiToken || existing?.cloudflare_api_token?.trim() || null;

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
    cloudflare_api_token: finalCfToken,
    updated_at: new Date().toISOString(),
    updated_by: auth.session.id,
  });

  if (error) return { error: "save_failed" };

  invalidateR2ConfigCache();
  return { success: true };
}

export async function saveCloudflareApiToken(
  token: string,
): Promise<{ success?: boolean; error?: string }> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  const trimmed = token.trim();
  if (!trimmed) return { error: "missing_cloudflare_token" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("storage_config")
    .update({
      cloudflare_api_token: trimmed,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) return { error: "save_failed" };
  return { success: true };
}

export async function verifyCloudflareApiToken(): Promise<{
  ok?: boolean;
  status?: string;
  message?: string;
  error?: string;
}> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  const token = await resolveCloudflareApiToken();
  if (!token) {
    return { error: "missing_cloudflare_token" };
  }

  try {
    const res = await fetch(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const json = (await res.json()) as {
      success?: boolean;
      result?: { status?: string };
      errors?: { message?: string }[];
    };

    if (json.success) {
      return {
        ok: true,
        status: json.result?.status ?? "active",
        message: json.result?.status ?? "active",
      };
    }

    const msg =
      json.errors?.[0]?.message ?? `HTTP ${res.status}: verification failed`;
    return { error: msg };
  } catch (e) {
    const message = e instanceof Error ? e.message : "verify_failed";
    return { error: message };
  }
}

export async function testStorageConnection(): Promise<{
  ok?: boolean;
  key?: string;
  steps?: string[];
  error?: string;
}> {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth;

  try {
    invalidateR2ConfigCache();
    await resolveR2Config();
  } catch {
    return {
      error: "missing_r2_s3_credentials",
    };
  }

  const result = await runR2StorageProbe();
  if (!result.ok) {
    return {
      error: result.error ?? "connection_failed",
      key: result.key,
      steps: result.steps,
    };
  }

  return {
    ok: true,
    key: result.key,
    steps: result.steps,
  };
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
