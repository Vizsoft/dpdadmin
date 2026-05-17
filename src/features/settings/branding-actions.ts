"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  ALLOWED_LOGO_EXTENSIONS,
  DEFAULT_APP_SETTINGS,
  LOGO_MIME_TYPES,
  MAX_LOGO_BYTES,
  isFontFamilyId,
} from "@/lib/branding/constants";

function revalidateBranding() {
  updateTag("app-settings");
}

async function requireSettingsManager() {
  const session = await getSessionUser();
  if (!session || !hasPermission(session.profile.role, "settings.manage")) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

export async function updateBranding(
  _locale: string,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const appName = String(formData.get("appName") ?? "").trim();
  const appSubtitle = String(formData.get("appSubtitle") ?? "").trim();
  const fontFamily = String(formData.get("fontFamily") ?? "");

  if (!appName || !appSubtitle) {
    return { error: "missing_fields" };
  }
  if (!isFontFamilyId(fontFamily)) {
    return { error: "invalid_font" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      app_name: appName,
      app_subtitle: appSubtitle,
      font_family: fontFamily,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateBranding();
  return { success: true };
}

export async function uploadLogo(
  _locale: string,
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

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_LOGO_EXTENSIONS.includes(ext as (typeof ALLOWED_LOGO_EXTENSIONS)[number])) {
    return { error: "invalid_type" };
  }

  const logoType = LOGO_MIME_TYPES[file.type];
  if (!logoType) {
    return { error: "invalid_type" };
  }

  const supabase = await createClient();
  const path = `logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("branding")
    .upload(path, buffer, {
      contentType: file.type,
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
      logo_url: logoUrl,
      logo_type: logoType,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (updateError) {
    return { error: "save_failed" };
  }

  revalidateBranding();
  return { success: true, logoUrl };
}

export async function resetBranding(): Promise<{ error?: string; success?: boolean }> {
  const auth = await requireSettingsManager();
  if ("error" in auth) return auth;

  const supabase = await createClient();

  await supabase.storage.from("branding").remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.webp", "logo.svg"]);

  const { error } = await supabase
    .from("app_settings")
    .update({
      app_name: DEFAULT_APP_SETTINGS.app_name,
      app_subtitle: DEFAULT_APP_SETTINGS.app_subtitle,
      font_family: DEFAULT_APP_SETTINGS.font_family,
      logo_url: null,
      logo_type: DEFAULT_APP_SETTINGS.logo_type,
      updated_at: new Date().toISOString(),
      updated_by: auth.session.id,
    })
    .eq("id", 1);

  if (error) {
    return { error: "save_failed" };
  }

  revalidateBranding();
  return { success: true };
}
