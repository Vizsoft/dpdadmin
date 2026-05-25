import { resolveFirebaseServerEnv } from "@/lib/firebase/env";
import { getFirebaseAccessToken } from "@/lib/firebase/google-auth";
import type {
  NotificationBatchInput,
  NotificationProvider,
  NotificationSendResult,
} from "@/lib/notifications/providers/provider";

type FcmMessage = {
  message: {
    token: string;
    notification: {
      title: string;
      body: string;
    };
    data: Record<string, string>;
  };
};

function toStringRecord(
  input: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
}

async function sendSingleFcmMessage(message: FcmMessage): Promise<{
  ok: boolean;
  id?: string;
  code?: string;
  message?: string;
}> {
  const env = resolveFirebaseServerEnv();
  const accessToken = await getFirebaseAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${env.projectId}/messages:send`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { status?: string; message?: string };
    };
    return {
      ok: false,
      code: errBody.error?.status ?? "FCM_SEND_FAILED",
      message: errBody.error?.message ?? `HTTP_${res.status}`,
    };
  }

  const body = (await res.json()) as { name?: string };
  return { ok: true, id: body.name };
}

export class FirebaseFcmNotificationProvider implements NotificationProvider {
  readonly name = "firebase_fcm";

  async sendBatch(input: NotificationBatchInput): Promise<NotificationSendResult[]> {
    const results: NotificationSendResult[] = [];

    for (const recipient of input.recipients) {
      const payload: FcmMessage = {
        message: {
          token: recipient.token,
          notification: {
            title: input.content.title,
            body: input.content.body,
          },
          data: {
            campaignId: input.campaignId,
            dispatchRunId: input.dispatchRunId,
            category: input.content.category,
            priority: input.content.priority,
            actionType: input.content.action.type,
            payloadVersion: input.content.action.schemaVersion,
            ...toStringRecord(input.content.action.params),
          },
        },
      };

      const sent = await sendSingleFcmMessage(payload);
      if (sent.ok) {
        results.push({
          recipientId: recipient.recipientId,
          success: true,
          externalMessageId: sent.id,
        });
      } else {
        results.push({
          recipientId: recipient.recipientId,
          success: false,
          providerErrorCode: sent.code,
          providerErrorMessage: sent.message,
        });
      }
    }

    return results;
  }

  async cancelScheduled(_externalId: string): Promise<void> {
    // FCM HTTP v1 has no direct "cancel scheduled message" API.
    // Scheduling/cancellation is controlled in our queue layer before dispatch.
  }

  async healthCheck(): Promise<{ ok: boolean; details?: string }> {
    try {
      await getFirebaseAccessToken();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        details: error instanceof Error ? error.message : "Unknown FCM error",
      };
    }
  }
}
