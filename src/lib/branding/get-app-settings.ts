import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_APP_SETTINGS,
  type FontFamilyId,
  type LogoType,
  isFontFamilyId,
} from "@/lib/branding/constants";
import { DEFAULT_THEME_ID } from "@/lib/theme/presets";
import {
  resolveTheme,
  type CustomThemeRow,
} from "@/lib/theme/resolve-theme";
import type { ResolvedTheme } from "@/lib/theme/resolve-theme";
import type { ThemeTokens } from "@/lib/theme/presets";

export type AppThemeRecord = {
  id: string;
  name: string;
  basePreset: string;
  lightTokens: Partial<ThemeTokens>;
  darkTokens: Partial<ThemeTokens>;
};

export type AppSettings = {
  appName: string;
  appSubtitle: string;
  fontFamily: FontFamilyId;
  logoUrl: string | null;
  logoType: LogoType;
  themeId: string;
  theme: ResolvedTheme;
  customThemes: AppThemeRecord[];
};

function parseTokens(json: unknown): Partial<ThemeTokens> {
  if (!json || typeof json !== "object") return {};
  return json as Partial<ThemeTokens>;
}

function normalizeRow(
  row: {
    app_name: string;
    app_subtitle: string;
    font_family: string;
    logo_url: string | null;
    logo_type: string;
    theme_id?: string | null;
  },
  customThemes: AppThemeRecord[],
): Omit<AppSettings, "theme"> & { themeId: string } {
  return {
    appName: row.app_name,
    appSubtitle: row.app_subtitle,
    fontFamily: isFontFamilyId(row.font_family) ? row.font_family : "inter",
    logoUrl: row.logo_url,
    logoType: row.logo_type === "svg" ? "svg" : "image",
    themeId: row.theme_id?.trim() || DEFAULT_THEME_ID,
    customThemes,
  };
}

async function fetchCustomThemes(): Promise<AppThemeRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_themes")
      .select("id, name, base_preset, light_tokens, dark_tokens")
      .order("name");

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      basePreset: row.base_preset,
      lightTokens: parseTokens(row.light_tokens),
      darkTokens: parseTokens(row.dark_tokens),
    }));
  } catch {
    return [];
  }
}

const getCustomThemes = cache(fetchCustomThemes);

const APP_SETTINGS_SELECT =
  "app_name, app_subtitle, font_family, logo_url, logo_type, theme_id";

async function loadAppSettingsRow(): Promise<{
  app_name: string;
  app_subtitle: string;
  font_family: string;
  logo_url: string | null;
  logo_type: string;
  theme_id?: string | null;
} | null> {
  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from("app_settings")
      .select(APP_SETTINGS_SELECT)
      .eq("id", 1)
      .maybeSingle();

    if (error?.code === "42703") {
      ({ data, error } = await supabase
        .from("app_settings")
        .select("app_name, app_subtitle, font_family, logo_url, logo_type")
        .eq("id", 1)
        .maybeSingle());
    }

    if (!error && data) return data;
  } catch {
    /* fall through to service role */
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("app_settings")
      .select(APP_SETTINGS_SELECT)
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) return data;
  } catch {
    /* use defaults */
  }

  return null;
}

async function fetchAppSettings(): Promise<AppSettings> {
  const customThemes = await getCustomThemes();
  const customRows: CustomThemeRow[] = customThemes.map((t) => ({
    id: t.id,
    name: t.name,
    base_preset: t.basePreset,
    light_tokens: t.lightTokens,
    dark_tokens: t.darkTokens,
  }));

  const data = await loadAppSettingsRow();

  if (!data) {
    const themeId = DEFAULT_THEME_ID;
    return {
      appName: DEFAULT_APP_SETTINGS.app_name,
      appSubtitle: DEFAULT_APP_SETTINGS.app_subtitle,
      fontFamily: DEFAULT_APP_SETTINGS.font_family,
      logoUrl: DEFAULT_APP_SETTINGS.logo_url,
      logoType: DEFAULT_APP_SETTINGS.logo_type,
      themeId,
      customThemes,
      theme: resolveTheme(themeId, customRows),
    };
  }

  const base = normalizeRow(data, customThemes);
  return {
    ...base,
    theme: resolveTheme(base.themeId, customRows),
  };
}

/** Per-request cache only — avoids stale logos after branding upload. */
export const getAppSettings = cache(fetchAppSettings);
