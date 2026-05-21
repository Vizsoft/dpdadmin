"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import type { RestaurantOption } from "./types";

export function DriverRestaurantPicker({
  partnerId,
  restaurants,
  selectedIds,
  onChange,
  disabled,
}: {
  partnerId: string;
  restaurants: RestaurantOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("pages.driverNew");

  const forPartner = useMemo(
    () =>
      partnerId
        ? restaurants.filter(
            (r) => r.partner_id === partnerId && r.status === "published",
          )
        : [],
    [restaurants, partnerId],
  );

  const toggle = (id: string, checked: boolean) => {
    if (checked) {
      onChange([...new Set([...selectedIds, id])]);
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  };

  if (!partnerId) {
    return (
      <p className="text-sm text-muted-foreground">{t("restaurantsSelectPartnerFirst")}</p>
    );
  }

  if (forPartner.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("restaurantsEmptyForPartner")}{" "}
        <Link href="/restaurants" className="text-primary hover:underline">
          {t("addRestaurantLink")}
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {forPartner.map((r) => {
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
  );
}
