"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  isPaletteColor,
  normalizeZoneColor,
  ZONE_COLOR_PALETTE,
} from "./zone-colors";

type ZoneColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  className?: string;
};

export function ZoneColorPicker({ value, onChange, className }: ZoneColorPickerProps) {
  const t = useTranslations("pages.zones");
  const normalized = normalizeZoneColor(value);
  const isCustom = !isPaletteColor(normalized);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {ZONE_COLOR_PALETTE.map((paletteColor) => {
          const selected = paletteColor === normalized;
          return (
            <button
              key={paletteColor}
              type="button"
              title={paletteColor}
              aria-label={t("colorSwatch", { color: paletteColor })}
              aria-pressed={selected}
              className={cn(
                "h-9 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent shadow-sm transition-transform hover:scale-105",
                selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: paletteColor }}
              onClick={() => onChange(paletteColor)}
            />
          );
        })}

        <Popover>
          <PopoverTrigger
            className={cn(
              "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-muted/50 shadow-sm transition-colors hover:bg-muted",
              isCustom &&
                "ring-2 ring-foreground ring-offset-2 ring-offset-background",
            )}
            style={isCustom ? { backgroundColor: normalized } : undefined}
            aria-label={t("customColor")}
          >
            {!isCustom && <Palette className="h-4 w-4 text-muted-foreground" />}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto">
            <PopoverHeader>
              <PopoverTitle>{t("customColor")}</PopoverTitle>
              <PopoverDescription>{t("customColorHint")}</PopoverDescription>
            </PopoverHeader>
            <label className="flex cursor-pointer flex-col items-center gap-2">
              <input
                type="color"
                value={normalized}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                className="h-12 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                aria-label={t("customColor")}
              />
              <span className="font-mono text-xs text-muted-foreground">{normalized}</span>
            </label>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
