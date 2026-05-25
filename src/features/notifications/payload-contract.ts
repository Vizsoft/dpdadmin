import { PAYLOAD_VERSION } from "./constants";
import type { ActionPayload, NotificationActionType } from "./types";

export function buildActionPayload(input: {
  actionType: NotificationActionType;
  actionParams?: Record<string, unknown>;
  deepLink?: string | null;
  campaignId?: string;
}): ActionPayload {
  return {
    action_type: input.actionType,
    action_params: input.actionParams ?? {},
    deep_link: input.deepLink ?? null,
    payload_version: PAYLOAD_VERSION,
    ...(input.campaignId ? { campaign_id: input.campaignId } : {}),
  };
}

export function buildFcmDataPayload(input: {
  campaignId: string;
  action: ActionPayload;
  category: string;
  priority: string;
}): Record<string, string> {
  return {
    campaign_id: input.campaignId,
    payload_version: String(input.action.payload_version),
    action_type: input.action.action_type,
    action_params: JSON.stringify(input.action.action_params),
    category: input.category,
    priority: input.priority,
    ...(input.action.deep_link ? { deep_link: input.action.deep_link } : {}),
  };
}

export function previewPayloadSchema(action: ActionPayload): string {
  return JSON.stringify(
    {
      version: action.payload_version,
      action_type: action.action_type,
      action_params: action.action_params,
      deep_link: action.deep_link,
    },
    null,
    2,
  );
}
