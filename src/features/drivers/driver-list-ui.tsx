"use client";

import { StatusPill } from "@/components/dashboard/status-pill";
import {
  formatPhoneDisplay,
  isValidKuwaitPhoneDigits,
  phoneStorageToDigits,
} from "./driver-phone";
import type { DriverAccountStatus } from "./types";

export function formatDriverCodeDisplay(code: string): string {
  const trimmed = code.trim();
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function formatPhoneInternational(stored: string): string {
  const digits = phoneStorageToDigits(stored);
  if (!isValidKuwaitPhoneDigits(digits)) return formatPhoneDisplay(stored);
  return `+965 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}

export function accountStatusVariant(
  status: DriverAccountStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

export function AccountStatusPill({
  status,
  label,
}: {
  status: DriverAccountStatus;
  label: string;
}) {
  return (
    <StatusPill variant={accountStatusVariant(status)} dot={false}>
      {label}
    </StatusPill>
  );
}

export function AttendancePill({
  onDuty,
  onDutyLabel,
  offDutyLabel,
}: {
  onDuty: boolean;
  onDutyLabel: string;
  offDutyLabel: string;
}) {
  return (
    <StatusPill variant={onDuty ? "success" : "neutral"} dot>
      {onDuty ? onDutyLabel : offDutyLabel}
    </StatusPill>
  );
}

export function PartnerCell({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <span className="truncate text-sm text-foreground">{name}</span>
    </div>
  );
}
