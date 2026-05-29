import { requiresApproval } from "./constants";
import type {
  NotificationCategory,
  NotificationPriority,
  SaveAutomationInput,
  SaveCampaignInput,
  TargetSpec,
} from "./types";

export type WizardStepId = "audience" | "content" | "action" | "delivery" | "review";

export function buildTargetSpec(input: {
  targetMode: TargetSpec["mode"];
  zoneIds: string[];
  partnerIds: string[];
  driverIds: string[];
  statuses: string[];
}): TargetSpec {
  if (input.targetMode === "zone") return { mode: "zone", zone_ids: input.zoneIds };
  if (input.targetMode === "partner") return { mode: "partner", partner_ids: input.partnerIds };
  if (input.targetMode === "custom") return { mode: "custom", driver_ids: input.driverIds };
  if (input.targetMode === "status") return { mode: "status", statuses: input.statuses };
  return { mode: input.targetMode };
}

export function isAudienceStepValid(input: {
  targetMode: TargetSpec["mode"];
  zoneIds: string[];
  partnerIds: string[];
  driverIds: string[];
  statuses: string[];
  audienceCount: number | null;
}): boolean {
  if (input.targetMode === "zone") return input.zoneIds.length > 0;
  if (input.targetMode === "partner") return input.partnerIds.length > 0;
  if (input.targetMode === "custom") return input.driverIds.length > 0;
  if (input.targetMode === "status") return input.statuses.length > 0;
  if (input.targetMode === "all") return (input.audienceCount ?? 1) > 0;
  return false;
}

export function isContentStepValid(title: string, body: string): boolean {
  return Boolean(title.trim() && body.trim());
}

export function isDeliveryStepValid(scheduleMode: "now" | "later", scheduledFor: string): boolean {
  if (scheduleMode === "now") return true;
  if (!scheduledFor.trim()) return false;
  const when = new Date(scheduledFor);
  return !Number.isNaN(when.getTime()) && when.getTime() > Date.now();
}

export function isActionStepValid(): boolean {
  return true;
}

export function campaignNeedsApproval(input: {
  category: NotificationCategory;
  priority: NotificationPriority;
  targetMode: TargetSpec["mode"];
}): boolean {
  return requiresApproval(input);
}

export function validateCampaignBeforeSubmit(input: {
  title: string;
  body: string;
  targetMode: TargetSpec["mode"];
  zoneIds: string[];
  partnerIds: string[];
  driverIds: string[];
  statuses: string[];
  audienceCount: number | null;
  scheduleMode: "now" | "later";
  scheduledFor: string;
}): WizardStepId | null {
  if (
    !isAudienceStepValid({
      targetMode: input.targetMode,
      zoneIds: input.zoneIds,
      partnerIds: input.partnerIds,
      driverIds: input.driverIds,
      statuses: input.statuses,
      audienceCount: input.audienceCount,
    })
  ) {
    return "audience";
  }
  if (!isContentStepValid(input.title, input.body)) return "content";
  if (!isDeliveryStepValid(input.scheduleMode, input.scheduledFor)) return "delivery";
  return null;
}

export function isAutomationContentValid(input: {
  contentMode: "template" | "inline";
  templateId: string;
  titleTemplate: string;
  bodyTemplate: string;
}): boolean {
  if (input.contentMode === "template") return Boolean(input.templateId.trim());
  return Boolean(input.titleTemplate.trim() && input.bodyTemplate.trim());
}

export function validateAutomationBeforeActivate(input: SaveAutomationInput): boolean {
  if (!input.name.trim()) return false;
  if (!isAutomationContentValid({
    contentMode: input.templateId ? "template" : "inline",
    templateId: input.templateId ?? "",
    titleTemplate: input.titleTemplate ?? "",
    bodyTemplate: input.bodyTemplate ?? "",
  })) {
    return false;
  }
  const spec = input.targetSpec ?? { mode: "all" };
  if (spec.mode === "zone" && !(spec.zone_ids?.length ?? 0)) return false;
  if (spec.mode === "partner" && !(spec.partner_ids?.length ?? 0)) return false;
  if (spec.mode === "custom" && !(spec.driver_ids?.length ?? 0)) return false;
  if (spec.mode === "status" && !(spec.statuses?.length ?? 0)) return false;
  return validateTriggerConfig(input.triggerType, input.triggerConfig ?? {});
}

export function validateTriggerConfig(
  triggerType: SaveAutomationInput["triggerType"],
  config: Record<string, unknown>,
): boolean {
  switch (triggerType) {
    case "inactivity":
      return typeof config.inactivity_days === "number" && config.inactivity_days > 0;
    case "document_expiry":
      return typeof config.days_before_expiry === "number" && config.days_before_expiry >= 0;
    case "shift_reminder":
      return typeof config.time === "string" && Boolean(String(config.time).trim());
    case "schedule":
      return typeof config.cron === "string" && Boolean(String(config.cron).trim());
    case "low_performance":
      return typeof config.min_deliveries === "number" && config.min_deliveries >= 0;
    case "missed_submission":
      return typeof config.hours_after_shift === "number" && config.hours_after_shift > 0;
    case "attendance_approved":
    case "salary_processed":
    case "incentive_unlocked":
      return true;
    default:
      return false;
  }
}
