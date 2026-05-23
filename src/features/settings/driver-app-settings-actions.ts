"use server";

import { refresh, revalidatePath, updateTag } from "next/cache";
import { logAdminMutation } from "@/lib/audit/log-admin-activity";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import {
  ALLOWED_LOGO_EXTENSIONS,
  ALLOWED_SPLASH_EXTENSIONS,
  DEFAULT_DRIVER_APP_SETTINGS,
  DRIVER_APP_LOGO_PREFIX,
  DRIVER_APP_SPLASH_PREFIX,
  MAX_DELIVERY_PROXIMITY_METERS,
  MAX_LOGO_BYTES,
  MAX_SPLASH_BYTES,
  MIN_DELIVERY_PROXIMITY_METERS,
  resolveLogoUploadMeta,
} from "@/lib/branding/constants";

function revalidateDriverAppSettings(locale: string) {
  updateTag("app-settings");
  revalidatePath("/", "layout");
  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/settings/app`, "page");
  refresh();
}

async function requireSettingsManager() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "settings.manage", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

function resolveSplashUploadMeta(
  file: File,
): { ext: string; contentType: string } | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_SPLASH_EXTENSIONS.includes(ext as (typeof ALLOWED_SPLASH_EXTENSIONS)[number])) {
    return null;
  }
  const mimeByExt: Record<(typeof ALLOWED_SPLASH_EXTENSIONS)[number], string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  const contentType =
    file.type && mimeByExt[ext as (typeof ALLOWED_SPLASH_EXTENSIONS)[number]]
      ? file.type
      : mimeByExt[ext as (typeof ALLOWED_SPLASH_EXTENSIONS)[number]];
  if (!contentType) return null;
  return { ext, contentType };
}

async function removeStoragePaths(paths: string[]) {
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from("branding").remove(paths);
}

export async function updateDriverAppSettings(
  locale: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const driverAppTitle = String(formData.get("driverAppTitle") ?? "").trim();
  const driverAppMaintenanceMessage = String(
    formData.get("driverAppMaintenanceMessage") ?? "",
  ).trim();

  if (!driverAppTitle || !driverAppMaintenanceMessage) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      driver_app_title: driverAppTitle,
      driver_app_maintenance_message: driverAppMaintenanceMessage,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  return { success: true };
}

export async function updateDriverAppMaintenanceMessage(
  locale: string,
  message: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const trimmed = message.trim();
  if (!trimmed) {
    return { error: "missing_fields" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      driver_app_maintenance_message: trimmed,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  return { success: true };
}

export async function updateDriverAppDeliveryProximity(
  locale: string,
  meters: number,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  if (
    !Number.isFinite(meters) ||
    meters < MIN_DELIVERY_PROXIMITY_METERS ||
    meters > MAX_DELIVERY_PROXIMITY_METERS
  ) {
    return { error: "invalid_proximity" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      driver_app_delivery_proximity_meters: Math.round(meters),
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  void logAdminMutation({
    action: "update",
    entityType: "app_settings",
    entityId: "1",
    routeName: "updateDriverAppDeliveryProximity",
    after: { driver_app_delivery_proximity_meters: Math.round(meters) },
  });
  return { success: true };
}

export async function uploadDriverAppLogo(
  locale: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; logoUrl?: string }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return { error: "missing_file" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "file_too_large" };
  }

  const meta = resolveLogoUploadMeta(file);
  if (!meta) {
    return { error: "invalid_type" };
  }

  const supabase = await createClient();
  const path = `${DRIVER_APP_LOGO_PREFIX}.${meta.ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await supabase.storage
    .from("branding")
    .remove(ALLOWED_LOGO_EXTENSIONS.map((e) => `${DRIVER_APP_LOGO_PREFIX}.${e}`));

  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: meta.contentType,
      upsert: true,
    });

  if (uploadError) {
    return { error: "upload_failed" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("branding").getPublicUrl(path);

  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("app_settings")
    .update({
      driver_app_logo_url: logoUrl,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (updateError) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  return { success: true, logoUrl };
}

export async function uploadDriverAppSplash(
  locale: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean; splashUrl?: string }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const file = formData.get("splash") as File | null;
  if (!file || file.size === 0) {
    return { error: "missing_file" };
  }
  if (file.size > MAX_SPLASH_BYTES) {
    return { error: "file_too_large" };
  }

  const meta = resolveSplashUploadMeta(file);
  if (!meta) {
    return { error: "invalid_type" };
  }

  const supabase = await createClient();
  const path = `${DRIVER_APP_SPLASH_PREFIX}.${meta.ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await supabase.storage
    .from("branding")
    .remove(ALLOWED_SPLASH_EXTENSIONS.map((e) => `${DRIVER_APP_SPLASH_PREFIX}.${e}`));

  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: meta.contentType,
      upsert: true,
    });

  if (uploadError) {
    return { error: "upload_failed" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("branding").getPublicUrl(path);

  const splashUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("app_settings")
    .update({
      driver_app_splash_url: splashUrl,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (updateError) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  return { success: true, splashUrl };
}

export async function setDriverAppMaintenanceMode(
  enabled: boolean,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      driver_app_maintenance_mode: enabled,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  updateTag("app-settings");
  return { success: true };
}

export async function resetDriverAppSettings(
  locale: string,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  await removeStoragePaths([
    ...ALLOWED_LOGO_EXTENSIONS.map((e) => `${DRIVER_APP_LOGO_PREFIX}.${e}`),
    ...ALLOWED_SPLASH_EXTENSIONS.map((e) => `${DRIVER_APP_SPLASH_PREFIX}.${e}`),
  ]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      driver_app_title: DEFAULT_DRIVER_APP_SETTINGS.driver_app_title,
      driver_app_logo_url: null,
      driver_app_splash_url: null,
      driver_app_maintenance_mode: false,
      driver_app_maintenance_message:
        DEFAULT_DRIVER_APP_SETTINGS.driver_app_maintenance_message,
      driver_app_delivery_proximity_meters:
        DEFAULT_DRIVER_APP_SETTINGS.driver_app_delivery_proximity_meters,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateDriverAppSettings(locale);
  return { success: true };
}
