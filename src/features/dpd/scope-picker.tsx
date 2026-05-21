"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DpdScopeOptions, RuleScopeType } from "./types";

export function ScopePicker({
  scopeType,
  zoneId,
  partnerId,
  restaurantId,
  onScopeTypeChange,
  onZoneIdChange,
  onPartnerIdChange,
  onRestaurantIdChange,
  options,
  disabled,
}: {
  scopeType: RuleScopeType;
  zoneId: string;
  partnerId: string;
  restaurantId: string;
  onScopeTypeChange: (v: RuleScopeType) => void;
  onZoneIdChange: (v: string) => void;
  onPartnerIdChange: (v: string) => void;
  onRestaurantIdChange: (v: string) => void;
  options: DpdScopeOptions | undefined;
  disabled?: boolean;
}) {
  const t = useTranslations("pages.dpd");

  const zones = options?.zones ?? [];
  const partners = options?.partners ?? [];
  const restaurants = options?.restaurants ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>{t("fields.scopeType")}</Label>
        <Select
          value={scopeType}
          onValueChange={(v) => {
            if (v) onScopeTypeChange(v as RuleScopeType);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full cursor-pointer rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zone" label={t("scope.zone")}>
              {t("scope.zone")}
            </SelectItem>
            <SelectItem value="partner" label={t("scope.partner")}>
              {t("scope.partner")}
            </SelectItem>
            <SelectItem value="restaurant" label={t("scope.restaurant")}>
              {t("scope.restaurant")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scopeType === "zone" ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{t("fields.zone")}</Label>
          <Select value={zoneId} onValueChange={(v) => onZoneIdChange(v ?? "")} disabled={disabled}>
            <SelectTrigger className="w-full cursor-pointer rounded-lg">
              <SelectValue placeholder={t("placeholders.selectZone")} />
            </SelectTrigger>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id} label={`${z.name} (${z.code})`}>
                  {z.name} ({z.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {scopeType === "partner" ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{t("fields.partner")}</Label>
          <Select
            value={partnerId}
            onValueChange={(v) => onPartnerIdChange(v ?? "")}
            disabled={disabled}
          >
            <SelectTrigger className="w-full cursor-pointer rounded-lg">
              <SelectValue placeholder={t("placeholders.selectPartner")} />
            </SelectTrigger>
            <SelectContent>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id} label={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {scopeType === "restaurant" ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{t("fields.restaurant")}</Label>
          <Select
            value={restaurantId}
            onValueChange={(v) => onRestaurantIdChange(v ?? "")}
            disabled={disabled}
          >
            <SelectTrigger className="w-full cursor-pointer rounded-lg">
              <SelectValue placeholder={t("placeholders.selectRestaurant")} />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem
                  key={r.id}
                  value={r.id}
                  label={`${r.name} · ${r.partner_name}`}
                >
                  {r.name} · {r.partner_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
