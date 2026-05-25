import type { PushMessage, PushProvider, PushSendResult } from "./push-provider";

export class NoopPushProvider implements PushProvider {
  readonly name = "noop";

  async sendBatch(messages: PushMessage[]): Promise<PushSendResult[]> {
    return messages.map((message) => ({
      token: message.token,
      ok: true,
      providerMessageId: `noop-${Math.random().toString(36).slice(2, 10)}`,
    }));
  }
}
