export type NotificationChannel = "push";

export type NotificationCategory =
  | "incentive"
  | "reminder"
  | "compliance"
  | "attendance"
  | "salary"
  | "emergency"
  | "announcement"
  | "operations"
  | "system_alert";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type NotificationLifecycleStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "opened"
  | "clicked"
  | "failed"
  | "cancelled"
  | "expired";

export type NotificationActionType =
  | "open_screen"
  | "open_module"
  | "open_record"
  | "open_workflow"
  | "open_url"
  | "custom_payload"
  | "silent_update_trigger";

export type NotificationActionPayload = {
  type: NotificationActionType;
  params: Record<string, unknown>;
  schemaVersion: string;
};

export type NotificationContentPayload = {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  templateId?: string | null;
  placeholders?: Record<string, string>;
  media?: {
    type: "image" | "video" | "document";
    url: string;
    metadata?: Record<string, string>;
  } | null;
  action: NotificationActionPayload;
};

export type NotificationRecipient = {
  recipientId: string;
  token: string;
  locale?: string | null;
};
