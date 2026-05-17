import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_APP_SETTINGS,
  type FontFamilyId,
  type LogoType,
  isFontFamilyId,
} from "@/lib/branding/constants";

export type AppSettings = {
  appName: string;
  appSubtitle: string;
  fontFamily: FontFamilyId;
  logoUrl: string | null;
  logoType: LogoType;
};

function normalizeRow(row: {
  app_name: string;
  app_subtitle: string;
  font_family: string;
  logo_url: string | null;
  logo_type: string;
}): AppSettings {
  return {
    appName: row.app_name,
    appSubtitle: row.app_subtitle,
    fontFamily: isFontFamilyId(row.font_family) ? row.font_family : "inter",
    logoUrl: row.logo_url,
    logoType: row.logo_type === "svg" ? "svg" : "image",
  };
}

async function fetchAppSettings(): Promise<AppSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("app_name, app_subtitle, font_family, logo_url, logo_type")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return {
        appName: DEFAULT_APP_SETTINGS.app_name,
        appSubtitle: DEFAULT_APP_SETTINGS.app_subtitle,
        fontFamily: DEFAULT_APP_SETTINGS.font_family,
        logoUrl: DEFAULT_APP_SETTINGS.logo_url,
        logoType: DEFAULT_APP_SETTINGS.logo_type,
      };
    }

    return normalizeRow(data);
  } catch {
    return {
      appName: DEFAULT_APP_SETTINGS.app_name,
      appSubtitle: DEFAULT_APP_SETTINGS.app_subtitle,
      fontFamily: DEFAULT_APP_SETTINGS.font_family,
      logoUrl: DEFAULT_APP_SETTINGS.logo_url,
      logoType: DEFAULT_APP_SETTINGS.logo_type,
    };
  }
}

export const getAppSettings = unstable_cache(fetchAppSettings, ["app-settings"], {
  tags: ["app-settings"],
});
