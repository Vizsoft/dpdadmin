import { siteConfig } from "@/config/site";

export type LogoType = "image" | "svg";
export type FontFamilyId = "inter" | "roboto" | "open-sans" | "dm-sans" | "plus-jakarta-sans";

export const DEFAULT_APP_SETTINGS = {
  app_name: siteConfig.name,
  app_subtitle: "Delivery Panel",
  font_family: "inter" as FontFamilyId,
  logo_url: siteConfig.logo,
  logo_type: "image" as LogoType,
};

export const FONT_OPTIONS: { id: FontFamilyId; label: string }[] = [
  { id: "inter", label: "Inter" },
  { id: "roboto", label: "Roboto" },
  { id: "open-sans", label: "Open Sans" },
  { id: "dm-sans", label: "DM Sans" },
  { id: "plus-jakarta-sans", label: "Plus Jakarta Sans" },
];

export const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"] as const;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const LOGO_MIME_TYPES: Record<string, LogoType> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/svg+xml": "svg",
};

export function isFontFamilyId(value: string): value is FontFamilyId {
  return FONT_OPTIONS.some((f) => f.id === value);
}
