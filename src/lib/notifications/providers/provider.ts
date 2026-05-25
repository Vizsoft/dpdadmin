import type {
  NotificationContentPayload,
  NotificationRecipient,
} from "@/lib/notifications/types";

export type NotificationSendResult = {
  recipientId: string;
  success: boolean;
  externalMessageId?: string;
  providerErrorCode?: string;
  providerErrorMessage?: string;
};

export type NotificationBatchInput = {
  campaignId: string;
  dispatchRunId: string;
  channel: "push";
  content: NotificationContentPayload;
  recipients: NotificationRecipient[];
};

export interface NotificationProvider {
  readonly name: string;
  sendBatch(input: NotificationBatchInput): Promise<NotificationSendResult[]>;
  cancelScheduled(externalId: string): Promise<void>;
  healthCheck(): Promise<{ ok: boolean; details?: string }>;
}
