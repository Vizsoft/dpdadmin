export type PushMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PushSendResult = {
  token: string;
  ok: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
};

export interface PushProvider {
  readonly name: string;
  sendBatch(messages: PushMessage[]): Promise<PushSendResult[]>;
}
