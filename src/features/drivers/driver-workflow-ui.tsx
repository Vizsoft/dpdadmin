"use client";

import { StatusPill } from "@/components/dashboard/status-pill";
import { Badge } from "@/components/ui/badge";
import { resolveStatusVariant } from "@/lib/ui/resolve-status-variant";
import type { DriverWorkflowStatus } from "./types";

export function WorkflowStatusPill({
  status,
  label,
}: {
  status: DriverWorkflowStatus;
  label: string;
}) {
  return (
    <StatusPill variant={resolveStatusVariant(status)} dot>
      {label}
    </StatusPill>
  );
}

export function LinkedBadge({
  linked,
  yesLabel,
  noLabel,
}: {
  linked: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return (
    <Badge
      variant={linked ? "default" : "secondary"}
      className="rounded-md font-normal"
    >
      {linked ? yesLabel : noLabel}
    </Badge>
  );
}
