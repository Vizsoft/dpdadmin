"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query/query-keys";
import { selectOptionsFrom } from "@/lib/select-items";
import { updateDriverWorkflowStatus } from "./drivers-actions";
import { isDriverErrorKey } from "./driver-errors";
import {
  DRIVER_WORKFLOW_STATUSES,
  type DriverWorkflowStatus,
} from "./types";

export function DriverWorkflowEditor({
  intakeId,
  value,
  disabled,
}: {
  intakeId: string;
  value: DriverWorkflowStatus;
  disabled?: boolean;
}) {
  const t = useTranslations("pages.drivers");
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const labelFor = (status: DriverWorkflowStatus) => {
    switch (status) {
      case "draft":
        return t("statusDraft");
      case "pending":
        return t("statusPending");
      case "approved":
        return t("statusApproved");
      default:
        return status;
    }
  };

  const onValueChange = (next: string | null) => {
    if (!next || next === value) return;
    const status = next as DriverWorkflowStatus;
    startTransition(async () => {
      const result = await updateDriverWorkflowStatus(intakeId, status);
      if (result.error) {
        toast.error(
          isDriverErrorKey(result.error)
            ? t(`errors.${result.error}`)
            : t("errors.save_failed"),
        );
        return;
      }
      toast.success(t("workflowUpdated"));
      await queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    });
  };

  const workflowSelectItems = selectOptionsFrom(
    DRIVER_WORKFLOW_STATUSES,
    (s) => s,
    (s) => labelFor(s),
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor="workflow-status">{t("fieldWorkflowStatus")}</Label>
      <Select
        items={workflowSelectItems}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isPending}
      >
        <SelectTrigger
          id="workflow-status"
          className="h-9 w-full min-w-[10rem] cursor-pointer rounded-lg"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue />
          )}
        </SelectTrigger>
        <SelectContent>
          {DRIVER_WORKFLOW_STATUSES.map((status) => (
            <SelectItem
              key={status}
              value={status}
              label={labelFor(status)}
              className="cursor-pointer"
            >
              {labelFor(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
