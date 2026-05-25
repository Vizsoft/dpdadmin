import { createClient } from "@/lib/supabase/server";
import { resolveFirebaseServerEnv } from "@/lib/firebase/env";
import { FirebasePushProvider } from "./providers/firebase-push-provider";
import { NoopPushProvider } from "./providers/noop-push-provider";
import type { PushProvider } from "./providers/push-provider";

type DispatchQueueItem = {
  id: string;
  campaign_id: string;
  recipient_token: string | null;
  idempotency_key: string;
};

function resolvePushProvider(): PushProvider {
  try {
    resolveFirebaseServerEnv();
    return new FirebasePushProvider();
  } catch {
    return new NoopPushProvider();
  }
}

export async function getNotificationRemoteConfig() {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("notification_remote_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (
    data ?? {
      id: 1,
      global_enabled: true,
      emergency_gate_enabled: true,
      broadcast_approval_required: true,
      high_priority_approval_required: true,
      category_overrides: {},
      throttle_overrides: {},
    }
  );
}

export async function enqueueCampaignForDispatch(campaignId: string, createdBy: string) {
  const supabase = await createClient();
  const idempotencyKey = `campaign-${campaignId}-${Date.now()}`;
  const { data: run, error } = await (supabase as any)
    .from("notification_dispatch_runs")
    .insert({
      campaign_id: campaignId,
      run_status: "queued",
      queued_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
      created_by: createdBy,
      updated_by: createdBy,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const { data: tokens } = await (supabase as any)
    .from("notification_device_tokens")
    .select("profile_id, token")
    .eq("is_active", true)
    .limit(1000);

  if (tokens?.length) {
    await (supabase as any).from("notification_dispatch_items").insert(
      tokens.map((token: { profile_id: string; token: string }, index: number) => ({
        run_id: run.id,
        campaign_id: campaignId,
        recipient_id: token.profile_id,
        recipient_token: token.token,
        idempotency_key: `${idempotencyKey}-${index}`,
      })),
    );
  }

  await (supabase as any)
    .from("notification_campaigns")
    .update({
      lifecycle_state: "queued",
      updated_at: new Date().toISOString(),
      updated_by: createdBy,
    })
    .eq("id", campaignId);

  await (supabase as any).from("notification_timeline").insert({
    campaign_id: campaignId,
    actor_id: createdBy,
    action: "queued",
    state_to: "queued",
    details: { runId: run.id },
  });

  return run;
}

export async function runNotificationDispatchWorker(limit = 200) {
  const supabase = await createClient();
  const provider = resolvePushProvider();
  const { data: pending } = await (supabase as any)
    .from("notification_dispatch_items")
    .select("id, campaign_id, recipient_token, idempotency_key")
    .eq("dispatch_status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  const queue: DispatchQueueItem[] = (pending ?? []) as DispatchQueueItem[];
  if (!queue.length) {
    return { processed: 0, sent: 0, failed: 0, provider: provider.name };
  }

  const campaignMap = new Map<string, { title: string; body: string; data_payload: Record<string, unknown> }>();
  const campaignIds = [...new Set(queue.map((item) => item.campaign_id))];
  const { data: campaigns } = await (supabase as any)
    .from("notification_campaigns")
    .select("id, title, body, data_payload")
    .in("id", campaignIds);
  for (const campaign of campaigns ?? []) {
    campaignMap.set(campaign.id, campaign);
  }

  const outbound = queue
    .filter((item) => item.recipient_token)
    .map((item) => {
      const campaign = campaignMap.get(item.campaign_id);
      return {
        queueId: item.id,
        campaignId: item.campaign_id,
        token: item.recipient_token as string,
        title: campaign?.title ?? "Notification",
        body: campaign?.body ?? "",
        data: Object.fromEntries(
          Object.entries((campaign?.data_payload ?? {}) as Record<string, unknown>).map(
            ([key, value]) => [key, String(value)],
          ),
        ),
      };
    });

  const results = await provider.sendBatch(
    outbound.map((item) => ({
      token: item.token,
      title: item.title,
      body: item.body,
      data: item.data,
    })),
  );

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < outbound.length; i += 1) {
    const message = outbound[i];
    const result = results[i];
    if (!result) continue;
    const status = result.ok ? "sent" : "failed";
    if (result.ok) sent += 1;
    else failed += 1;

    await (supabase as any)
      .from("notification_dispatch_items")
      .update({
        dispatch_status: status,
        attempt_count: 1,
        provider_message_id: result.providerMessageId ?? null,
        failure_code: result.errorCode ?? null,
        failure_message: result.errorMessage ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message.queueId);

    await (supabase as any).from("notification_events").insert({
      campaign_id: message.campaignId,
      item_id: message.queueId,
      event_type: result.ok ? "sent" : "failed",
      metadata: {
        provider: provider.name,
        providerMessageId: result.providerMessageId ?? null,
        errorCode: result.errorCode ?? null,
      },
    });
  }

  await updateCampaignLifecycleFromDispatch(campaignIds);
  return { processed: queue.length, sent, failed, provider: provider.name };
}

async function updateCampaignLifecycleFromDispatch(campaignIds: string[]) {
  if (!campaignIds.length) return;
  const supabase = await createClient();
  for (const campaignId of campaignIds) {
    const { data } = await (supabase as any).rpc(
      "notification_compute_lifecycle_stats",
      { p_campaign_id: campaignId },
    );
    const stats = (data ?? {}) as Record<string, number>;
    const failed = Number(stats.failed ?? 0);
    const sent = Number(stats.sent ?? 0);
    const delivered = Number(stats.delivered ?? 0);
    const opened = Number(stats.opened ?? 0);
    const clicked = Number(stats.clicked ?? 0);
    const nowIso = new Date().toISOString();

    let state = "processing";
    if (failed > 0 && sent === 0) state = "failed";
    else if (clicked > 0) state = "clicked";
    else if (opened > 0) state = "opened";
    else if (delivered > 0) state = "delivered";
    else if (sent > 0) state = "sent";

    await (supabase as any)
      .from("notification_campaigns")
      .update({
        lifecycle_state: state,
        sent_at: sent > 0 ? nowIso : null,
        completed_at: sent > 0 || failed > 0 ? nowIso : null,
      })
      .eq("id", campaignId);
  }
}

export async function flushNotificationAnalyticsForCampaign(campaignId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await (supabase as any).rpc("notification_compute_lifecycle_stats", {
    p_campaign_id: campaignId,
  });
  const stats = (data ?? {}) as Record<string, number>;
  await (supabase as any).from("notification_analytics_daily").upsert({
    metric_date: today,
    campaign_id: campaignId,
    sent_count: Number(stats.sent ?? 0),
    delivered_count: Number(stats.delivered ?? 0),
    opened_count: Number(stats.opened ?? 0),
    clicked_count: Number(stats.clicked ?? 0),
    failed_count: Number(stats.failed ?? 0),
    unique_recipients: Number(stats.sent ?? 0),
  });
}
