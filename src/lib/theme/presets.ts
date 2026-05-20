export const THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
export type ThemeTokens = Record<ThemeTokenKey, string>;

export type PresetThemeId = "shopify" | "coral" | "slate" | "minimal";

export type ThemePreset = {
  id: PresetThemeId;
  name: string;
  lightTokens: ThemeTokens;
  darkTokens: ThemeTokens;
};

function tokens(
  light: ThemeTokens,
  dark: ThemeTokens,
): { lightTokens: ThemeTokens; darkTokens: ThemeTokens } {
  return { lightTokens: light, darkTokens: dark };
}

/** Shopify-inspired: dark sidebar, emerald primary, neutral content */
const shopify = tokens(
  {
    background: "oklch(0.97 0.005 250)",
    foreground: "oklch(0.22 0.01 250)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.22 0.01 250)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.22 0.01 250)",
    primary: "oklch(0.45 0.14 155)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.94 0.01 250)",
    "secondary-foreground": "oklch(0.28 0.01 250)",
    muted: "oklch(0.94 0.01 250)",
    "muted-foreground": "oklch(0.5 0.01 250)",
    accent: "oklch(0.94 0.02 155)",
    "accent-foreground": "oklch(0.35 0.1 155)",
    destructive: "oklch(0.55 0.2 25)",
    border: "oklch(0.9 0.01 250)",
    input: "oklch(0.9 0.01 250)",
    ring: "oklch(0.45 0.14 155)",
    sidebar: "oklch(0.2 0.015 250)",
    "sidebar-foreground": "oklch(0.92 0.01 250)",
    "sidebar-primary": "oklch(0.45 0.14 155)",
    "sidebar-primary-foreground": "oklch(1 0 0)",
    "sidebar-accent": "oklch(0.28 0.02 250)",
    "sidebar-accent-foreground": "oklch(0.97 0 0)",
    "sidebar-border": "oklch(0.28 0.02 250)",
    "sidebar-ring": "oklch(0.45 0.14 155)",
  },
  {
    background: "oklch(0.16 0.01 250)",
    foreground: "oklch(0.95 0.01 250)",
    card: "oklch(0.2 0.01 250)",
    "card-foreground": "oklch(0.95 0.01 250)",
    popover: "oklch(0.2 0.01 250)",
    "popover-foreground": "oklch(0.95 0.01 250)",
    primary: "oklch(0.55 0.16 155)",
    "primary-foreground": "oklch(0.12 0.01 250)",
    secondary: "oklch(0.24 0.01 250)",
    "secondary-foreground": "oklch(0.95 0.01 250)",
    muted: "oklch(0.24 0.01 250)",
    "muted-foreground": "oklch(0.65 0.01 250)",
    accent: "oklch(0.28 0.04 155)",
    "accent-foreground": "oklch(0.75 0.12 155)",
    destructive: "oklch(0.6 0.18 25)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 12%)",
    ring: "oklch(0.55 0.16 155)",
    sidebar: "oklch(0.14 0.015 250)",
    "sidebar-foreground": "oklch(0.9 0.01 250)",
    "sidebar-primary": "oklch(0.55 0.16 155)",
    "sidebar-primary-foreground": "oklch(0.12 0.01 250)",
    "sidebar-accent": "oklch(0.22 0.02 250)",
    "sidebar-accent-foreground": "oklch(0.97 0 0)",
    "sidebar-border": "oklch(1 0 0 / 8%)",
    "sidebar-ring": "oklch(0.55 0.16 155)",
  },
);

/** Original DPD warm cream + coral */
const coral = tokens(
  {
    background: "oklch(0.98 0.01 85)",
    foreground: "oklch(0.21 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.21 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.21 0 0)",
    primary: "oklch(0.21 0 0)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.96 0.01 85)",
    "secondary-foreground": "oklch(0.21 0 0)",
    muted: "oklch(0.96 0.01 85)",
    "muted-foreground": "oklch(0.58 0 0)",
    accent: "oklch(0.65 0.19 25)",
    "accent-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.65 0.19 25)",
    border: "oklch(0.92 0.02 85)",
    input: "oklch(0.92 0.02 85)",
    ring: "oklch(0.65 0.19 25)",
    sidebar: "oklch(0.24 0.02 280)",
    "sidebar-foreground": "oklch(0.97 0 0)",
    "sidebar-primary": "oklch(0.97 0 0)",
    "sidebar-primary-foreground": "oklch(0.21 0 0)",
    "sidebar-accent": "oklch(0.9 0.03 75)",
    "sidebar-accent-foreground": "oklch(0.21 0 0)",
    "sidebar-border": "oklch(0.32 0.02 280)",
    "sidebar-ring": "oklch(0.9 0.03 75)",
  },
  {
    background: "oklch(0.18 0.01 60)",
    foreground: "oklch(0.98 0 0)",
    card: "oklch(0.22 0.01 60)",
    "card-foreground": "oklch(0.98 0 0)",
    popover: "oklch(0.22 0.01 60)",
    "popover-foreground": "oklch(0.98 0 0)",
    primary: "oklch(0.98 0 0)",
    "primary-foreground": "oklch(0.21 0 0)",
    secondary: "oklch(0.28 0.01 60)",
    "secondary-foreground": "oklch(0.98 0 0)",
    muted: "oklch(0.28 0.01 60)",
    "muted-foreground": "oklch(0.65 0 0)",
    accent: "oklch(0.72 0.17 25)",
    "accent-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.72 0.17 25)",
    border: "oklch(1 0 0 / 12%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.72 0.17 25)",
    sidebar: "oklch(0.22 0.01 60)",
    "sidebar-foreground": "oklch(0.98 0 0)",
    "sidebar-primary": "oklch(0.98 0 0)",
    "sidebar-primary-foreground": "oklch(0.21 0 0)",
    "sidebar-accent": "oklch(0.32 0.04 25)",
    "sidebar-accent-foreground": "oklch(0.72 0.17 25)",
    "sidebar-border": "oklch(1 0 0 / 12%)",
    "sidebar-ring": "oklch(0.72 0.17 25)",
  },
);

/** Cool blue-gray professional */
const slate = tokens(
  {
    background: "oklch(0.98 0.005 260)",
    foreground: "oklch(0.2 0.02 260)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.2 0.02 260)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.2 0.02 260)",
    primary: "oklch(0.45 0.08 260)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.94 0.01 260)",
    "secondary-foreground": "oklch(0.25 0.02 260)",
    muted: "oklch(0.94 0.01 260)",
    "muted-foreground": "oklch(0.5 0.02 260)",
    accent: "oklch(0.55 0.12 250)",
    "accent-foreground": "oklch(1 0 0)",
    destructive: "oklch(0.55 0.2 25)",
    border: "oklch(0.9 0.01 260)",
    input: "oklch(0.9 0.01 260)",
    ring: "oklch(0.45 0.08 260)",
    sidebar: "oklch(0.22 0.02 260)",
    "sidebar-foreground": "oklch(0.95 0.01 260)",
    "sidebar-primary": "oklch(0.55 0.12 250)",
    "sidebar-primary-foreground": "oklch(1 0 0)",
    "sidebar-accent": "oklch(0.3 0.03 260)",
    "sidebar-accent-foreground": "oklch(0.97 0 0)",
    "sidebar-border": "oklch(0.3 0.03 260)",
    "sidebar-ring": "oklch(0.55 0.12 250)",
  },
  {
    background: "oklch(0.15 0.015 260)",
    foreground: "oklch(0.95 0.01 260)",
    card: "oklch(0.19 0.015 260)",
    "card-foreground": "oklch(0.95 0.01 260)",
    popover: "oklch(0.19 0.015 260)",
    "popover-foreground": "oklch(0.95 0.01 260)",
    primary: "oklch(0.7 0.08 260)",
    "primary-foreground": "oklch(0.15 0.015 260)",
    secondary: "oklch(0.24 0.02 260)",
    "secondary-foreground": "oklch(0.95 0.01 260)",
    muted: "oklch(0.24 0.02 260)",
    "muted-foreground": "oklch(0.65 0.02 260)",
    accent: "oklch(0.6 0.1 250)",
    "accent-foreground": "oklch(0.95 0.01 260)",
    destructive: "oklch(0.6 0.18 25)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 12%)",
    ring: "oklch(0.6 0.1 250)",
    sidebar: "oklch(0.12 0.02 260)",
    "sidebar-foreground": "oklch(0.92 0.01 260)",
    "sidebar-primary": "oklch(0.6 0.1 250)",
    "sidebar-primary-foreground": "oklch(0.12 0.02 260)",
    "sidebar-accent": "oklch(0.2 0.025 260)",
    "sidebar-accent-foreground": "oklch(0.97 0 0)",
    "sidebar-border": "oklch(1 0 0 / 8%)",
    "sidebar-ring": "oklch(0.6 0.1 250)",
  },
);

/** High-contrast minimal light sidebar */
const minimal = tokens(
  {
    background: "oklch(0.99 0 0)",
    foreground: "oklch(0.15 0 0)",
    card: "oklch(1 0 0)",
    "card-foreground": "oklch(0.15 0 0)",
    popover: "oklch(1 0 0)",
    "popover-foreground": "oklch(0.15 0 0)",
    primary: "oklch(0.2 0 0)",
    "primary-foreground": "oklch(1 0 0)",
    secondary: "oklch(0.96 0 0)",
    "secondary-foreground": "oklch(0.2 0 0)",
    muted: "oklch(0.96 0 0)",
    "muted-foreground": "oklch(0.5 0 0)",
    accent: "oklch(0.94 0 0)",
    "accent-foreground": "oklch(0.2 0 0)",
    destructive: "oklch(0.55 0.2 25)",
    border: "oklch(0.9 0 0)",
    input: "oklch(0.9 0 0)",
    ring: "oklch(0.2 0 0)",
    sidebar: "oklch(0.98 0 0)",
    "sidebar-foreground": "oklch(0.25 0 0)",
    "sidebar-primary": "oklch(0.2 0 0)",
    "sidebar-primary-foreground": "oklch(1 0 0)",
    "sidebar-accent": "oklch(0.94 0 0)",
    "sidebar-accent-foreground": "oklch(0.15 0 0)",
    "sidebar-border": "oklch(0.9 0 0)",
    "sidebar-ring": "oklch(0.2 0 0)",
  },
  {
    background: "oklch(0.12 0 0)",
    foreground: "oklch(0.96 0 0)",
    card: "oklch(0.16 0 0)",
    "card-foreground": "oklch(0.96 0 0)",
    popover: "oklch(0.16 0 0)",
    "popover-foreground": "oklch(0.96 0 0)",
    primary: "oklch(0.96 0 0)",
    "primary-foreground": "oklch(0.12 0 0)",
    secondary: "oklch(0.2 0 0)",
    "secondary-foreground": "oklch(0.96 0 0)",
    muted: "oklch(0.2 0 0)",
    "muted-foreground": "oklch(0.6 0 0)",
    accent: "oklch(0.22 0 0)",
    "accent-foreground": "oklch(0.96 0 0)",
    destructive: "oklch(0.6 0.18 25)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 12%)",
    ring: "oklch(0.7 0 0)",
    sidebar: "oklch(0.14 0 0)",
    "sidebar-foreground": "oklch(0.9 0 0)",
    "sidebar-primary": "oklch(0.96 0 0)",
    "sidebar-primary-foreground": "oklch(0.12 0 0)",
    "sidebar-accent": "oklch(0.2 0 0)",
    "sidebar-accent-foreground": "oklch(0.96 0 0)",
    "sidebar-border": "oklch(1 0 0 / 8%)",
    "sidebar-ring": "oklch(0.7 0 0)",
  },
);

export const THEME_PRESETS: ThemePreset[] = [
  { id: "shopify", name: "Shopify", ...shopify },
  { id: "coral", name: "DPD Coral", ...coral },
  { id: "slate", name: "Slate Pro", ...slate },
  { id: "minimal", name: "Minimal", ...minimal },
];

export const DEFAULT_THEME_ID: PresetThemeId = "shopify";

export const PRESET_THEME_IDS = new Set<string>(
  THEME_PRESETS.map((p) => p.id),
);

export function getPresetById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

export function isPresetThemeId(id: string): id is PresetThemeId {
  return PRESET_THEME_IDS.has(id);
}

export function tokensToCssVars(tokens: Partial<ThemeTokens>): string {
  return Object.entries(tokens)
    .filter(([, v]) => v)
    .map(([key, value]) => `--${key}: ${value};`)
    .join("\n  ");
}

export function buildCustomThemeCss(
  themeId: string,
  lightTokens: Partial<ThemeTokens>,
  darkTokens: Partial<ThemeTokens>,
): string {
  const light = tokensToCssVars(lightTokens);
  const dark = tokensToCssVars(darkTokens);
  return `html[data-theme="${themeId}"] {\n  ${light}\n}\nhtml[data-theme="${themeId}"].dark {\n  ${dark}\n}`;
}
