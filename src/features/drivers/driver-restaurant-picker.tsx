"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import type { RestaurantOption } from "./types";

export function DriverRestaurantPicker({
  restaurants,
  selectedIds,
  onChange,
  disabled,
}: {
  restaurants: RestaurantOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("pages.driverNew");

  const published = useMemo(
    () => restaurants.filter((r) => r.status === "published"),
    [restaurants],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, RestaurantOption[]>();
    for (const r of published) {
      const key = r.partner_id ?? "__none__";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }, [published]);

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...new Set([...selectedIds, id])]);
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  };

  if (published.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("restaurantsEmpty")}{" "}
        <Link href="/restaurants" className="text-primary hover:underline">
          {t("addRestaurantLink")}
        </Link>
      </p>
    );
  }

  const groupLabel = (key: string) => {
    if (key === "__none__") return t("restaurantsUnassignedGroup");
    const match = published.find((r) => r.partner_id === key);
    return match?.partner_name ?? t("restaurantsUnassignedGroup");
  };

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([key, items]) => (
        <div key={key} className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {groupLabel(key)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((r) => {
              const checked = selectedIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted/40 has-disabled:cursor-not-allowed has-disabled:opacity-60"
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(v) => toggle(r.id, v === true)}
                  />
                  <span className="min-w-0 text-sm font-medium text-foreground">{r.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{t("restaurantsActivationHint")}</p>
    </div>
  );
}
