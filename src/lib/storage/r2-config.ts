import { createAdminClient } from "@/lib/supabase/admin";

export type R2RuntimeConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  source: "env" | "database";
};

type StorageConfigRow = {
  r2_account_id: string | null;
  r2_access_key_id: string | null;
  r2_secret_access_key: string | null;
  r2_bucket_name: string | null;
  r2_s3_endpoint: string | null;
};

let cached: R2RuntimeConfig | null = null;

export function invalidateR2ConfigCache(): void {
  cached = null;
}

function configFromEnv(): R2RuntimeConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }
  const endpoint =
    process.env.R2_S3_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    source: "env",
  };
}

async function configFromDatabase(): Promise<R2RuntimeConfig | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("storage_config")
    .select(
      "r2_account_id, r2_access_key_id, r2_secret_access_key, r2_bucket_name, r2_s3_endpoint",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as StorageConfigRow;
  const accountId = row.r2_account_id?.trim();
  const accessKeyId = row.r2_access_key_id?.trim();
  const secretAccessKey = row.r2_secret_access_key?.trim();
  const bucketName = row.r2_bucket_name?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const endpoint =
    row.r2_s3_endpoint?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    source: "database",
  };
}

export async function resolveR2Config(): Promise<R2RuntimeConfig> {
  if (cached) return cached;

  const fromEnv = configFromEnv();
  if (fromEnv) {
    cached = fromEnv;
    return fromEnv;
  }

  const fromDb = await configFromDatabase();
  if (fromDb) {
    cached = fromDb;
    return fromDb;
  }

  throw new Error(
    "Cloudflare R2 is not configured. Add credentials under Settings → Cloudflare R2, or set R2_* environment variables.",
  );
}

export async function isR2Configured(): Promise<boolean> {
  try {
    await resolveR2Config();
    return true;
  } catch {
    return false;
  }
}

export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
