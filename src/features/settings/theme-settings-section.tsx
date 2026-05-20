"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "@/contexts/branding-context";
import {
  createCustomTheme,
  deleteCustomTheme,
  setActiveTheme,
} from "@/features/settings/theme-actions";
import { THEME_PRESETS, type PresetThemeId } from "@/lib/theme/presets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeEditorDialog } from "@/features/settings/theme-editor-dialog";
import type { AppThemeRecord } from "@/lib/branding/get-app-settings";
import { cn } from "@/lib/utils";

function ThemeSwatch({ color }: { color: string }) {
  return (
    <span
      className="h-6 w-6 shrink-0 rounded border border-border"
      style={{ background: color }}
    />
  );
}

function PresetCard({
  id,
  name,
  active,
  sidebar,
  background,
  primary,
  onActivate,
  disabled,
}: {
  id: string;
  name: string;
  active: boolean;
  sidebar: string;
  background: string;
  primary: string;
  onActivate: () => void;
  disabled: boolean;
}) {
  const t = useTranslations("pages.settings.branding.theme");

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border p-3 transition-colors",
        active ? "border-primary ring-1 ring-primary/30" : "border-border",
      )}
    >
      {active && (
        <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <p className="text-sm font-medium">{name}</p>
      <div className="flex gap-1.5">
        <ThemeSwatch color={sidebar} />
        <ThemeSwatch color={background} />
        <ThemeSwatch color={primary} />
      </div>
      <Button
        type="button"
        size="sm"
        variant={active ? "secondary" : "default"}
        className="cursor-pointer"
        disabled={disabled || active}
        onClick={onActivate}
      >
        {active ? t("active") : t("activate")}
      </Button>
    </div>
  );
}

export function ThemeSettingsSection() {
  const t = useTranslations("pages.settings.branding.theme");
  const router = useRouter();
  const branding = useBranding();
  const [isPending, startTransition] = useTransition();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<AppThemeRecord | null>(null);
  const [clonePreset, setClonePreset] = useState<PresetThemeId>("shopify");

  const activate = (themeId: string) => {
    startTransition(async () => {
      const result = await setActiveTheme(themeId);
      if (result.error) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("activated"));
      router.refresh();
    });
  };

  const handleClone = () => {
    const preset = THEME_PRESETS.find((p) => p.id === clonePreset);
    if (!preset) return;
    startTransition(async () => {
      const result = await createCustomTheme({
        name: `${preset.name} copy`,
        basePreset: preset.id,
        lightTokens: preset.lightTokens,
        darkTokens: preset.darkTokens,
      });
      if (result.error) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("cloned"));
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteCustomTheme(id);
      if (result.error) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("deleted"));
      router.refresh();
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium">{t("presets")}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {THEME_PRESETS.map((preset) => (
                <PresetCard
                  key={preset.id}
                  id={preset.id}
                  name={preset.name}
                  active={branding.themeId === preset.id}
                  sidebar={preset.lightTokens.sidebar}
                  background={preset.lightTokens.background}
                  primary={preset.lightTokens.primary}
                  onActivate={() => activate(preset.id)}
                  disabled={isPending}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{t("customThemes")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={clonePreset}
                  onValueChange={(v) => v && setClonePreset(v as PresetThemeId)}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer gap-1"
                  disabled={isPending}
                  onClick={handleClone}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t("clonePreset")}
                </Button>
              </div>
            </div>

            {branding.customThemes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noCustomThemes")}</p>
            ) : (
              <ul className="space-y-2">
                {branding.customThemes.map((theme) => (
                  <li
                    key={theme.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                      branding.themeId === theme.id && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ThemeSwatch color={theme.lightTokens.sidebar ?? "#333"} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{theme.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("basedOn", { preset: theme.basePreset })}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {branding.themeId !== theme.id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="cursor-pointer h-8"
                          disabled={isPending}
                          onClick={() => activate(theme.id)}
                        >
                          {t("activate")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-pointer"
                        disabled={isPending}
                        onClick={() => {
                          setEditingTheme(theme);
                          setEditorOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="cursor-pointer text-destructive"
                        disabled={isPending}
                        onClick={() => handleDelete(theme.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <ThemeEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingTheme(null);
        }}
        theme={editingTheme}
      />
    </>
  );
}
