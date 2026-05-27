"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateCustomTheme } from "@/features/settings/theme-actions";
import {
  THEME_TOKEN_KEYS,
  getPresetById,
  type PresetThemeId,
  type ThemeTokenKey,
  type ThemeTokens,
} from "@/lib/theme/presets";
import type { AppThemeRecord } from "@/lib/branding/get-app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TOKEN_GROUPS: { label: string; keys: ThemeTokenKey[] }[] = [
  {
    label: "sidebar",
    keys: [
      "sidebar",
      "sidebar-foreground",
      "sidebar-accent",
      "sidebar-accent-foreground",
      "sidebar-border",
    ],
  },
  {
    label: "content",
    keys: ["background", "foreground", "card", "muted", "muted-foreground", "border"],
  },
  {
    label: "primary",
    keys: ["primary", "primary-foreground", "accent", "accent-foreground"],
  },
];

export function ThemeEditorDialog({
  open,
  onOpenChange,
  theme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: AppThemeRecord | null;
}) {
  const t = useTranslations("pages.settings.branding.theme");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [light, setLight] = useState<Partial<ThemeTokens>>({});
  const [dark, setDark] = useState<Partial<ThemeTokens>>({});

  useEffect(() => {
    if (!theme) return;
    setName(theme.name);
    const base = getPresetById(theme.basePreset as PresetThemeId);
    setLight({ ...base?.lightTokens, ...theme.lightTokens });
    setDark({ ...base?.darkTokens, ...theme.darkTokens });
  }, [theme]);

  if (!theme) return null;

  const save = () => {
    startTransition(async () => {
      const overridesLight: Partial<ThemeTokens> = {};
      const overridesDark: Partial<ThemeTokens> = {};
      const base = getPresetById(theme.basePreset as PresetThemeId);

      for (const key of THEME_TOKEN_KEYS) {
        if (light[key] && light[key] !== base?.lightTokens[key]) {
          overridesLight[key] = light[key];
        }
        if (dark[key] && dark[key] !== base?.darkTokens[key]) {
          overridesDark[key] = dark[key];
        }
      }

      const result = await updateCustomTheme(theme.id, {
        name: name.trim(),
        lightTokens: overridesLight,
        darkTokens: overridesDark,
      });
      if (result.error) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("saved"));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pe-14">
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>{t("editSubtitle")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="themeName">{t("themeName")}</Label>
            <Input
              id="themeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ThemePreview label={t("previewLight")} tokens={light} />
            <ThemePreview label={t("previewDark")} tokens={dark} isDark />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">{t("lightMode")}</p>
            {TOKEN_GROUPS.map((group) => (
              <TokenGroup
                key={`light-${group.label}`}
                label={t(`groups.${group.label}`)}
                keys={group.keys}
                values={light}
                onChange={(key, value) => setLight((prev) => ({ ...prev, [key]: value }))}
                disabled={isPending}
              />
            ))}
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("darkMode")}</p>
            {TOKEN_GROUPS.map((group) => (
              <TokenGroup
                key={`dark-${group.label}`}
                label={t(`groups.${group.label}`)}
                keys={group.keys}
                values={dark}
                onChange={(key, value) => setDark((prev) => ({ ...prev, [key]: value }))}
                disabled={isPending}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="button" className="cursor-pointer" disabled={isPending} onClick={save}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ThemePreview({
  label,
  tokens,
  isDark,
}: {
  label: string;
  tokens: Partial<ThemeTokens>;
  isDark?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className="flex h-24 overflow-hidden rounded-lg border border-border"
        style={{
          background: tokens.background ?? "#f5f5f5",
          color: tokens.foreground ?? "#111",
        }}
      >
        <div
          className="w-1/3 p-2 text-[10px]"
          style={{
            background: tokens.sidebar ?? "#222",
            color: tokens["sidebar-foreground"] ?? "#fff",
          }}
        >
          Nav
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          <span
            className="inline-block h-4 w-12 rounded text-[9px] leading-4 text-center"
            style={{
              background: tokens.primary ?? "#333",
              color: tokens["primary-foreground"] ?? "#fff",
            }}
          >
            Btn
          </span>
          <span className="text-[10px] opacity-70">{isDark ? "Dark" : "Light"}</span>
        </div>
      </div>
    </div>
  );
}

function TokenGroup({
  label,
  keys,
  values,
  onChange,
  disabled,
}: {
  label: string;
  keys: ThemeTokenKey[];
  values: Partial<ThemeTokens>;
  onChange: (key: ThemeTokenKey, value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium capitalize text-muted-foreground">{label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((key) => (
          <div key={key} className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">{key}</Label>
            <Input
              className="h-8 font-mono text-xs"
              value={values[key] ?? ""}
              onChange={(e) => onChange(key, e.target.value)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
