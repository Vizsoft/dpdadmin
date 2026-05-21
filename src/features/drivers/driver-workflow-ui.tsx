"use client";

import { StatusPill } from "@/components/dashboard/status-pill";
import { Badge } from "@/components/ui/badge";
import type { DriverWorkflowStatus } from "./types";

export function workflowStatusVariant(
  status: DriverWorkflowStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "draft":
    default:
      return "neutral";
  }
}

export function WorkflowStatusPill({
  status,
  label,
}: {
  status: DriverWorkflowStatus;
  label: string;
}) {
  return (
    <StatusPill variant={workflowStatusVariant(status)} dot>
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
