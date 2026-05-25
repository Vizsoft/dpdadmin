import type { Messaging } from "firebase-admin/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/admin";
import type { PushMessage, PushProvider, PushSendResult } from "./push-provider";

export class FirebasePushProvider implements PushProvider {
  readonly name = "firebase-fcm";

  async sendBatch(messages: PushMessage[]): Promise<PushSendResult[]> {
    const messaging: Messaging | null = await getFirebaseMessaging();
    if (!messaging) {
      return messages.map((message) => ({
        token: message.token,
        ok: false,
        errorCode: "firebase_not_configured",
        errorMessage: "Firebase admin credentials are not configured.",
      }));
    }

    const response = await messaging.sendEach(
      messages.map((message) => ({
        token: message.token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data,
      })),
      false,
    );

    return response.responses.map((item, index) => ({
      token: messages[index]?.token ?? "",
      ok: item.success,
      providerMessageId: item.messageId,
      errorCode: item.error?.code,
      errorMessage: item.error?.message,
    }));
  }
}
