"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectOptionsFrom } from "@/lib/select-items";
import { RESTAURANT_STATUSES, type RestaurantStatus } from "./restaurant-status";
import type { RestaurantPartnerOption, RestaurantZoneOption } from "./types";

type FieldLabels = {
  partner: string;
  zone: string;
  name: string;
  externalMerchantId: string;
  externalMerchantIdHint: string;
  mapLink: string;
  mapLinkHint: string;
  status: string;
  statusHint: string;
  selectPartner: string;
  selectZone: string;
  namePlaceholder: string;
  mapLinkPlaceholder: string;
  statusDraft: string;
  statusPublished: string;
  statusArchived: string;
};

function statusLabel(t: FieldLabels, status: RestaurantStatus) {
  switch (status) {
    case "published":
      return t.statusPublished;
    case "archived":
      return t.statusArchived;
    default:
      return t.statusDraft;
  }
}

export function RestaurantFormFields({
  labels,
  partnerId,
  zoneId,
  name,
  externalMerchantId,
  mapLink,
  status,
  partners,
  zones,
  partnersLoading,
  zonesLoading,
  onPartnerIdChange,
  onZoneIdChange,
  onNameChange,
  onExternalMerchantIdChange,
  onMapLinkChange,
  onStatusChange,
}: {
  labels: FieldLabels;
  partnerId: string;
  zoneId: string;
  name: string;
  externalMerchantId: string;
  mapLink: string;
  status: RestaurantStatus;
  partners: RestaurantPartnerOption[];
  zones: RestaurantZoneOption[];
  partnersLoading: boolean;
  zonesLoading: boolean;
  onPartnerIdChange: (id: string) => void;
  onZoneIdChange: (id: string) => void;
  onNameChange: (value: string) => void;
  onExternalMerchantIdChange: (value: string) => void;
  onMapLinkChange: (value: string) => void;
  onStatusChange: (value: RestaurantStatus) => void;
}) {
  const partnerSelectItems = selectOptionsFrom(
    partners,
    (p) => p.id,
    (p) => p.name,
  );
  const zoneSelectItems = selectOptionsFrom(
    zones,
    (z) => z.id,
    (z) => `${z.name} (${z.code})`,
  );
  const statusSelectItems = RESTAURANT_STATUSES.map((s) => ({
    value: s,
    label: statusLabel(labels, s),
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{labels.partner}</Label>
        <Select
          items={partnerSelectItems}
          value={partnerId || null}
          onValueChange={(v) => onPartnerIdChange(v ?? "")}
          disabled={partnersLoading || partners.length === 0}
        >
          <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg bg-background">
            <SelectValue placeholder={labels.selectPartner} />
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

      <div className="space-y-1.5">
        <Label>{labels.zone}</Label>
        <Select
          items={zoneSelectItems}
          value={zoneId || null}
          onValueChange={(v) => onZoneIdChange(v ?? "")}
          disabled={zonesLoading || zones.length === 0}
        >
          <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg bg-background">
            <SelectValue placeholder={labels.selectZone} />
          </SelectTrigger>
          <SelectContent>
            {zones.map((z) => (
              <SelectItem
                key={z.id}
                value={z.id}
                label={`${z.name} (${z.code})`}
              >
                {z.name} ({z.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="restaurant-name">{labels.name}</Label>
        <Input
          id="restaurant-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={labels.namePlaceholder}
          className="rounded-lg bg-background"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="external-id">{labels.externalMerchantId}</Label>
        <Input
          id="external-id"
          value={externalMerchantId}
          onChange={(e) => onExternalMerchantIdChange(e.target.value)}
          className="rounded-lg bg-background font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground">
          {labels.externalMerchantIdHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="map-link">{labels.mapLink}</Label>
        <Input
          id="map-link"
          value={mapLink}
          onChange={(e) => onMapLinkChange(e.target.value)}
          placeholder={labels.mapLinkPlaceholder}
          className="rounded-lg bg-background text-sm"
        />
        <p className="text-[11px] text-muted-foreground">{labels.mapLinkHint}</p>
      </div>

      <div className="space-y-1.5">
        <Label>{labels.status}</Label>
        <Select
          items={statusSelectItems}
          value={status}
          onValueChange={(v) =>
            onStatusChange((v as RestaurantStatus) ?? "draft")
          }
        >
          <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESTAURANT_STATUSES.map((s) => (
              <SelectItem
                key={s}
                value={s}
                label={statusLabel(labels, s)}
              >
                {statusLabel(labels, s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{labels.statusHint}</p>
      </div>
    </div>
  );
}
