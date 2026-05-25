import { createClient } from "@/lib/supabase/server";
import { FirebaseFcmNotificationProvider } from "@/lib/firebase/fcm";
import { resolveNotificationRuntimeConfig } from "@/lib/firebase/env";
import { recordNotificationTelemetry } from "@/lib/notifications/telemetry";
import type {
  NotificationBatchInput,
  NotificationSendResult,
} from "@/lib/notifications/providers/provider";
import type {
  NotificationContentPayload,
  NotificationRecipient,
} from "@/lib/notifications/types";

type DispatchTargetSpec = {
  target_kind: string;
  include_rules?: Record<string, unknown> | null;
  exclude_rules?: Record<string, unknown> | null;
  dynamic_filter_rules?: Record<string, unknown> | null;
  custom_user_ids?: string[] | null;
};

type RunDispatchInput = {
  campaignId: string;
  content: NotificationContentPayload;
  targetSpec: DispatchTargetSpec;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function resolveRecipients(
  targetSpec: DispatchTargetSpec,
): Promise<NotificationRecipient[]> {
  const supabase = (await createClient()) as any;
  let query = supabase
    .from("drivers")
    .select("id, profiles!inner(id), profiles!inner(locale), app_push_token, zone_id, partner_id, status");

  const includeRules = targetSpec.include_rules ?? {};
  const targetKind = targetSpec.target_kind;
  if (targetKind === "zone") {
    const zoneIds = (includeRules.zoneIds as string[] | undefined) ?? [];
    if (zoneIds.length > 0) query = query.in("zone_id", zoneIds);
  }
  if (targetKind === "partner") {
    const partnerIds = (includeRules.partnerIds as string[] | undefined) ?? [];
    if (partnerIds.length > 0) query = query.in("partner_id", partnerIds);
  }
  if (targetKind === "status") {
    const statuses = (includeRules.statuses as string[] | undefined) ?? [];
    if (statuses.length > 0) query = query.in("status", statuses);
  }
  if (targetKind === "custom_selection") {
    const ids = targetSpec.custom_user_ids ?? [];
    if (ids.length > 0) query = query.in("id", ids);
  }

  const { data, error } = await query.not("app_push_token", "is", null);
  if (error) throw new Error(error.message);

  const recipients = (data ?? [])
    .filter(
      (row: { id: string; app_push_token?: string | null }) =>
        Boolean(row.app_push_token),
    )
    .map(
      (row: {
        id: string;
        app_push_token: string;
        profiles?: { locale?: string | null };
      }) => ({
        recipientId: row.id,
        token: row.app_push_token,
        locale: row.profiles?.locale ?? null,
      }),
    );

  return recipients;
}

async function upsertAudienceSnapshot(
  campaignId: string,
  recipients: NotificationRecipient[],
) {
  const supabase = (await createClient()) as any;
  if (recipients.length === 0) return;
  const rows = recipients.map((recipient) => ({
    campaign_id: campaignId,
    recipient_user_id: recipient.recipientId,
    included_by: { source: "dispatch_compile" },
    snapshot_version: 1,
    locale: recipient.locale ?? null,
  }));

  const { error } = await supabase
    .from("notification_audience_snapshots")
    .upsert(rows, {
      onConflict: "campaign_id,recipient_user_id,snapshot_version",
      ignoreDuplicates: false,
    });
  if (error) throw new Error(error.message);
}

async function persistDispatchResults(
  dispatchRunId: string,
  campaignId: string,
  content: NotificationContentPayload,
  recipients: NotificationRecipient[],
  sendResults: NotificationSendResult[],
) {
  const supabase = (await createClient()) as any;
  const recipientMap = new Map(recipients.map((r) => [r.recipientId, r]));
  const now = new Date().toISOString();
  const rows = sendResults.map((result) => ({
    dispatch_run_id: dispatchRunId,
    campaign_id: campaignId,
    recipient_user_id: result.recipientId,
    provider_name: "firebase_fcm",
    provider_message_id: result.externalMessageId ?? null,
    provider_token: recipientMap.get(result.recipientId)?.token ?? null,
    provider_status: result.success ? "sent" : "failed",
    status: result.success ? "sent" : "failed",
    attempts: 1,
    sent_at: result.success ? now : null,
    failed_at: result.success ? null : now,
    error_code: result.providerErrorCode ?? null,
    error_message: result.providerErrorMessage ?? null,
    payload: content,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from("notification_dispatch_items").insert(rows);
    if (error) throw new Error(error.message);
  }

  const totalSent = sendResults.filter((r) => r.success).length;
  const totalFailed = sendResults.length - totalSent;
  const { error: updateError } = await supabase
    .from("notification_dispatch_runs")
    .update({
      status: totalFailed > 0 ? "processing" : "sent",
      total_recipients: sendResults.length,
      total_sent: totalSent,
      total_failed: totalFailed,
      finished_at: now,
    })
    .eq("id", dispatchRunId);
  if (updateError) throw new Error(updateError.message);

  await recordNotificationTelemetry({
    eventName: "notification_sent",
    campaignId,
    dispatchRunId,
    metadata: {
      total_recipients: sendResults.length,
      total_sent: totalSent,
      total_failed: totalFailed,
    },
  });
}

export async function runNotificationDispatch({
  campaignId,
  content,
  targetSpec,
}: RunDispatchInput) {
  const supabase = (await createClient()) as any;
  const cfg = resolveNotificationRuntimeConfig();
  const provider = new FirebaseFcmNotificationProvider();

  const recipients = await resolveRecipients(targetSpec);
  await upsertAudienceSnapshot(campaignId, recipients);

  const { data: dispatchRun, error: runError } = await supabase
    .from("notification_dispatch_runs")
    .insert({
      campaign_id: campaignId,
      provider_name: provider.name,
      trigger_source: "manual",
      status: "processing",
      queued_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      total_recipients: recipients.length,
    })
    .select("*")
    .single();
  if (runError) throw new Error(runError.message);

  const batches = chunk(recipients, cfg.batchSize);
  const sendResults: NotificationSendResult[] = [];
  for (const recipientsBatch of batches) {
    const batchInput: NotificationBatchInput = {
      campaignId,
      dispatchRunId: dispatchRun.id,
      channel: "push",
      content,
      recipients: recipientsBatch,
    };
    const result = await provider.sendBatch(batchInput);
    sendResults.push(...result);

    // coarse rate control
    if (cfg.sendRatePerMinute > 0) {
      const pauseMs = Math.ceil(
        (60_000 / cfg.sendRatePerMinute) * recipientsBatch.length,
      );
      if (pauseMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(pauseMs, 1000)));
      }
    }
  }

  await persistDispatchResults(
    dispatchRun.id,
    campaignId,
    content,
    recipients,
    sendResults,
  );

  await supabase
    .from("notification_campaigns")
    .update({
      status: sendResults.some((r) => !r.success) ? "processing" : "sent",
      audience_estimate: recipients.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  return dispatchRun;
}
