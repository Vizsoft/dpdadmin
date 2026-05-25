"use server";

import { logAdminMutation, logAdminRead } from "@/lib/audit/log-admin-activity";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { buildActionPayload, buildFcmDataPayload } from "./payload-contract";
import { DEFAULT_TIMEZONE, PAYLOAD_VERSION, requiresApproval } from "./constants";
import { sendPushBatch } from "@/lib/firebase/fcm-provider";
import type {
  NotificationActionError,
  NotificationAutomationRow,
  NotificationCampaignRow,
  NotificationDashboardKpis,
  NotificationListFilters,
  NotificationTemplateRow,
  SaveCampaignInput,
  TargetSpec,
} from "./types";

const KUWAIT_TZ = DEFAULT_TIMEZONE;

async function notificationsDb() {
  return (await createClient()) as any;
}

function notificationsAdminDb() {
  return createAdminClient() as any;
}

async function requireNotificationsView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "notifications.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }
  return session;
}

async function requireNotificationsManage() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "notifications.manage", session.isSuperAdmin)
  ) {
    return null;
  }
  return session;
}

async function requireNotificationsSend() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "notifications.send", session.isSuperAdmin)
  ) {
    return null;
  }
  return session;
}

async function requireNotificationsApprove() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "notifications.approve", session.isSuperAdmin)
  ) {
    return null;
  }
  return session;
}

function kuwaitToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KUWAIT_TZ }).format(new Date());
}

function mapCampaign(row: Record<string, unknown>): NotificationCampaignRow {
  return row as unknown as NotificationCampaignRow;
}

export async function getNotificationDashboardKpis(): Promise<NotificationDashboardKpis> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const today = kuwaitToday();
  const start = `${today}T00:00:00+03:00`;

  const [sentRes, scheduledRes, draftsRes, failedRes, automationsRes, activityRes, campaignsRes] =
    await Promise.all([
      supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", start)
        .in("status", ["sent", "delivered", "opened", "clicked"]),
      supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled"),
      supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("notification_campaigns")
        .select("failed_count")
        .gte("created_at", start),
      supabase
        .from("notification_automations")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("notification_events")
        .select("id", { count: "exact", head: true })
        .gte("occurred_at", start),
      supabase
        .from("notification_campaigns")
        .select("recipient_count, delivered_count, opened_count, failed_count")
        .gte("sent_at", start),
    ]);

  const campaigns = campaignsRes.data ?? [];
  const totalRecipients = campaigns.reduce(
    (sum: number, c: { recipient_count?: number }) => sum + (c.recipient_count ?? 0),
    0,
  );
  const totalDelivered = campaigns.reduce(
    (sum: number, c: { delivered_count?: number }) => sum + (c.delivered_count ?? 0),
    0,
  );
  const totalOpened = campaigns.reduce(
    (sum: number, c: { opened_count?: number }) => sum + (c.opened_count ?? 0),
    0,
  );
  const failedToday = (failedRes.data ?? []).reduce(
    (sum: number, c: { failed_count?: number }) => sum + (c.failed_count ?? 0),
    0,
  );

  await logAdminRead("notifications", "dashboard", {});

  return {
    sentToday: sentRes.count ?? 0,
    scheduled: scheduledRes.count ?? 0,
    drafts: draftsRes.count ?? 0,
    deliveryRate: totalRecipients > 0 ? Math.round((totalDelivered / totalRecipients) * 100) : 0,
    failedDeliveries: failedToday,
    openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
    activeAutomations: automationsRes.count ?? 0,
    recentActivity: activityRes.count ?? 0,
  };
}

export async function listNotificationCampaigns(
  filters: NotificationListFilters = {},
): Promise<NotificationCampaignRow[]> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  let query = supabase
    .from("notification_campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters.search?.trim()) {
    query = query.or(
      `title.ilike.%${filters.search.trim()}%,body.ilike.%${filters.search.trim()}%`,
    );
  }
  if (filters.fromDate) query = query.gte("created_at", `${filters.fromDate}T00:00:00`);
  if (filters.toDate) query = query.lte("created_at", `${filters.toDate}T23:59:59`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  await logAdminRead("notifications", "list", filters as Record<string, unknown>);
  return (data ?? []).map((row: Record<string, unknown>) => mapCampaign(row));
}

export async function getNotificationCampaign(
  id: string,
): Promise<NotificationCampaignRow | null> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCampaign(data as Record<string, unknown>) : null;
}

export async function estimateNotificationAudience(
  targetSpec: TargetSpec,
  exclusionSpec: Record<string, unknown> = {},
): Promise<number> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const { data, error } = await supabase.rpc("estimate_notification_audience", {
    p_target_spec: targetSpec,
    p_exclusion_spec: exclusionSpec,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function saveNotificationCampaign(
  input: SaveCampaignInput,
  campaignId?: string | null,
): Promise<{ id: string } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  if (!input.title.trim() || !input.body.trim()) {
    return { error: "invalid_input" };
  }

  const needsApproval = requiresApproval({
    category: input.category,
    priority: input.priority,
    targetMode: input.targetSpec.mode,
  });

  const supabase = await notificationsDb();
  const audience = await estimateNotificationAudience(
    input.targetSpec,
    input.exclusionSpec ?? {},
  );

  const row = {
    title: input.title.trim(),
    body: input.body.trim(),
    category: input.category,
    priority: input.priority,
    template_id: input.templateId ?? null,
    target_spec: input.targetSpec,
    exclusion_spec: input.exclusionSpec ?? {},
    action_type: input.actionType,
    action_params: input.actionParams ?? {},
    payload_version: PAYLOAD_VERSION,
    schedule_spec: input.scheduleSpec,
    timezone: input.timezone ?? KUWAIT_TZ,
    scheduled_for: input.scheduleSpec.scheduled_for ?? null,
    expires_at: input.expiresAt ?? null,
    send_limit: input.sendLimit ?? null,
    requires_approval: needsApproval,
    estimated_audience_count: audience,
    updated_by: session.id,
  };

  if (campaignId) {
    const { data, error } = await supabase
      .from("notification_campaigns")
      .update(row)
      .eq("id", campaignId)
      .in("status", ["draft", "pending_approval", "scheduled"])
      .select("id")
      .maybeSingle();
    if (error || !data) return { error: "save_failed" };
    await logAdminMutation({
      action: "update",
      entityType: "notification_campaign",
      entityId: data.id,
      routeName: "notifications",
      context: { campaignId: data.id },
    });
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("notification_campaigns")
    .insert({ ...row, created_by: session.id, status: "draft" })
    .select("id")
    .single();
  if (error || !data) return { error: "save_failed" };
  await logAdminMutation({
    action: "create",
    entityType: "notification_campaign",
    entityId: data.id,
    routeName: "notifications",
    context: { campaignId: data.id },
  });
  return { id: data.id };
}

export async function submitNotificationForApproval(
  campaignId: string,
): Promise<{ ok: true } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { error } = await supabase
    .from("notification_campaigns")
    .update({
      status: "pending_approval",
      submitted_for_approval_at: new Date().toISOString(),
      updated_by: session.id,
    })
    .eq("id", campaignId)
    .eq("status", "draft");
  if (error) return { error: "save_failed" };
  await logAdminMutation({
    action: "update",
    entityType: "notification_campaign",
    entityId: campaignId,
    routeName: "notifications",
    context: { step: "submit_approval" },
  });
  return { ok: true };
}

export async function approveNotificationCampaign(
  campaignId: string,
): Promise<{ ok: true } | { error: NotificationActionError }> {
  const session = await requireNotificationsApprove();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { data: campaign } = await supabase
    .from("notification_campaigns")
    .select("schedule_spec, scheduled_for")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return { error: "not_found" };

  const scheduleSpec = campaign.schedule_spec as { mode?: string } | null;
  const nextStatus =
    scheduleSpec?.mode === "later" || campaign.scheduled_for ? "scheduled" : "queued";

  const { error } = await supabase
    .from("notification_campaigns")
    .update({
      status: nextStatus,
      approved_by: session.id,
      approved_at: new Date().toISOString(),
      updated_by: session.id,
    })
    .eq("id", campaignId)
    .eq("status", "pending_approval");
  if (error) return { error: "save_failed" };
  await logAdminMutation({
    action: "update",
    entityType: "notification_campaign",
    entityId: campaignId,
    routeName: "notifications",
    context: { step: "approve" },
  });
  return { ok: true };
}

export async function dispatchNotificationCampaign(
  campaignId: string,
): Promise<{ ok: true; sent: number; failed: number } | { error: NotificationActionError }> {
  const session = await requireNotificationsSend();
  if (!session) return { error: "not_authorized" };
  return executeNotificationDispatch(campaignId, session.id);
}

async function executeNotificationDispatch(
  campaignId: string,
  actorUserId: string | null,
): Promise<{ ok: true; sent: number; failed: number } | { error: NotificationActionError }> {
  const service = notificationsAdminDb();
  const { data: campaign, error: campaignError } = await service
    .from("notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (campaignError || !campaign) return { error: "not_found" };

  const { data: remoteConfig } = await service
    .from("notification_remote_config")
    .select("global_enabled, emergency_gate_enabled, category_throttles")
    .eq("id", 1)
    .maybeSingle();

  if (remoteConfig && remoteConfig.global_enabled === false) {
    return { error: "dispatch_failed" };
  }
  if (
    campaign.category === "emergency" &&
    remoteConfig?.emergency_gate_enabled === false
  ) {
    return { error: "dispatch_failed" };
  }

  if (campaign.requires_approval && !campaign.approved_at) {
    return { error: "approval_required" };
  }

  const targetSpec = campaign.target_spec as TargetSpec;
  const exclusionSpec = (campaign.exclusion_spec ?? {}) as Record<string, unknown>;

  const { data: snapshotId, error: snapshotError } = await service.rpc(
    "compile_notification_audience",
    {
      p_campaign_id: campaignId,
      p_target_spec: targetSpec,
      p_exclusion_spec: exclusionSpec,
    },
  );
  if (snapshotError) return { error: "dispatch_failed" };

  const { data: snapshot } = await service
    .from("notification_audience_snapshots")
    .select("recipient_ids, recipient_count")
    .eq("id", snapshotId)
    .single();

  const recipientIds = (snapshot?.recipient_ids ?? []) as string[];
  if (recipientIds.length === 0) return { error: "empty_audience" };

  const idempotencyKey = `campaign:${campaignId}:${Date.now()}`;
  const { data: run, error: runError } = await service
    .from("notification_dispatch_runs")
    .insert({
      campaign_id: campaignId,
      snapshot_id: snapshotId,
      status: "processing",
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
      total_count: recipientIds.length,
    })
    .select("id")
    .single();
  if (runError || !run) return { error: "dispatch_failed" };

  const { data: tokens } = await service
    .from("driver_push_tokens")
    .select("id, driver_id, token")
    .in("driver_id", recipientIds)
    .eq("is_active", true);

  type TokenRow = { driver_id: string; id: string; token: string };
  const tokenByDriver = new Map<string, TokenRow>(
    (tokens ?? []).map((t: TokenRow) => [t.driver_id, t]),
  );
  const action = buildActionPayload({
    actionType: campaign.action_type,
    actionParams: (campaign.action_params ?? {}) as Record<string, unknown>,
    campaignId,
  });
  const dataPayload = buildFcmDataPayload({
    campaignId,
    action,
    category: campaign.category,
    priority: campaign.priority,
  });

  const messages = recipientIds
    .map((driverId: string) => {
      const tokenRow = tokenByDriver.get(driverId);
      if (!tokenRow) return null;
      return {
        token: tokenRow.token,
        title: campaign.title,
        body: campaign.body,
        data: dataPayload,
        driverId,
        pushTokenId: tokenRow.id,
      };
    })
    .filter(Boolean) as Array<{
    token: string;
    title: string;
    body: string;
    data: Record<string, string>;
    driverId: string;
    pushTokenId: string;
  }>;

  const batchResult = await sendPushBatch(messages);

  const itemRows = recipientIds.map((driverId: string) => {
    const sent = messages.find((m) => m.driverId === driverId);
    const messageId = batchResult.messageIds.find((m) => m.token === sent?.token)?.messageId;
    const err = batchResult.errors.find((e) => e.token === sent?.token);
    return {
      run_id: run.id,
      campaign_id: campaignId,
      driver_id: driverId,
      push_token_id: sent?.pushTokenId ?? null,
      status: messageId ? "sent" : sent ? "failed" : "skipped",
      provider_message_id: messageId ?? null,
      error_code: err?.code ?? (sent ? null : "no_token"),
      error_message: err?.message ?? (sent ? null : "No active push token"),
      sent_at: messageId ? new Date().toISOString() : null,
    };
  });

  await service.from("notification_dispatch_items").insert(itemRows);

  const sentCount = batchResult.successCount;
  const failedCount = recipientIds.length - sentCount;

  await service
    .from("notification_dispatch_runs")
    .update({
      status: failedCount === recipientIds.length ? "failed" : "sent",
      sent_count: sentCount,
      failed_count: failedCount,
      finished_at: new Date().toISOString(),
    })
    .eq("id", run.id);

  await service
    .from("notification_campaigns")
    .update({
      status: failedCount === recipientIds.length ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      recipient_count: recipientIds.length,
      failed_count: failedCount,
      delivered_count: sentCount,
      updated_by: actorUserId,
    })
    .eq("id", campaignId);

  if (actorUserId) {
    await logAdminMutation({
      action: "update",
      entityType: "notification_campaign",
      entityId: campaignId,
      routeName: "notifications",
      context: { sentCount, failedCount },
    });
  }
  return { ok: true, sent: sentCount, failed: failedCount };
}

export async function cloneNotificationCampaign(
  campaignId: string,
): Promise<{ id: string } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { data: source, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (error || !source) return { error: "not_found" };

  const { data, error: insertError } = await supabase
    .from("notification_campaigns")
    .insert({
      title: `${source.title} (copy)`,
      body: source.body,
      category: source.category,
      priority: source.priority,
      template_id: source.template_id,
      target_spec: source.target_spec,
      exclusion_spec: source.exclusion_spec,
      action_type: source.action_type,
      action_params: source.action_params,
      payload_version: source.payload_version,
      schedule_spec: source.schedule_spec,
      timezone: source.timezone,
      requires_approval: source.requires_approval,
      estimated_audience_count: source.estimated_audience_count,
      cloned_from_id: campaignId,
      status: "draft",
      created_by: session.id,
      updated_by: session.id,
    })
    .select("id")
    .single();
  if (insertError || !data) return { error: "save_failed" };
  await logAdminMutation({
    action: "create",
    entityType: "notification_campaign",
    entityId: data.id,
    routeName: "notifications",
    context: { sourceId: campaignId, cloned: true },
  });
  return { id: data.id };
}

export async function listNotificationTemplates(): Promise<NotificationTemplateRow[]> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const { data, error } = await supabase
    .from("notification_templates")
    .select("*")
    .eq("is_archived", false)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationTemplateRow[];
}

export async function listNotificationAutomations(): Promise<NotificationAutomationRow[]> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const { data, error } = await supabase
    .from("notification_automations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as NotificationAutomationRow[];
}

export async function getNotificationTargetingOptions(): Promise<{
  zones: Array<{ id: string; name: string }>;
  partners: Array<{ id: string; name: string }>;
  drivers: Array<{ id: string; label: string }>;
}> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const [zonesRes, partnersRes, driversRes] = await Promise.all([
    supabase.from("zones").select("id, name").order("name"),
    supabase.from("partners").select("id, name").order("name"),
    supabase
      .from("drivers")
      .select("id, driver_code, profiles(full_name)")
      .is("archived_at", null)
      .order("driver_code")
      .limit(500),
  ]);

  return {
    zones: (zonesRes.data ?? []).map((z: { id: string; name: string }) => ({ id: z.id, name: z.name })),
    partners: (partnersRes.data ?? []).map((p: { id: string; name: string }) => ({
      id: p.id,
      name: p.name,
    })),
    drivers: (driversRes.data ?? []).map(
      (d: {
        id: string;
        driver_code: string;
        profiles?: { full_name?: string | null } | Array<{ full_name?: string | null }>;
      }) => {
        const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
        const name = profile?.full_name?.trim() || "Driver";
        return { id: d.id, label: `${d.driver_code} · ${name}` };
      },
    ),
  };
}

export async function scheduleNotificationCampaign(
  campaignId: string,
): Promise<{ ok: true } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { data: campaign } = await supabase
    .from("notification_campaigns")
    .select("requires_approval, scheduled_for, schedule_spec")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign?.scheduled_for) return { error: "invalid_input" };

  const nextStatus = campaign.requires_approval ? "pending_approval" : "scheduled";
  const { error } = await supabase
    .from("notification_campaigns")
    .update({
      status: nextStatus,
      updated_by: session.id,
      ...(nextStatus === "pending_approval"
        ? { submitted_for_approval_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", campaignId)
    .in("status", ["draft"]);
  if (error) return { error: "save_failed" };

  await logAdminMutation({
    action: "update",
    entityType: "notification_campaign",
    entityId: campaignId,
    routeName: "notifications",
    context: { step: "schedule" },
  });
  return { ok: true };
}

export async function rejectNotificationCampaign(
  campaignId: string,
  reason?: string,
): Promise<{ ok: true } | { error: NotificationActionError }> {
  const session = await requireNotificationsApprove();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { error } = await supabase
    .from("notification_campaigns")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      last_error: reason ?? "Rejected by approver",
      updated_by: session.id,
    })
    .eq("id", campaignId)
    .eq("status", "pending_approval");
  if (error) return { error: "save_failed" };

  await logAdminMutation({
    action: "update",
    entityType: "notification_campaign",
    entityId: campaignId,
    routeName: "notifications",
    context: { step: "reject", reason: reason ?? null },
  });
  return { ok: true };
}

export async function cancelNotificationCampaign(
  campaignId: string,
): Promise<{ ok: true } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { error } = await supabase
    .from("notification_campaigns")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_by: session.id,
    })
    .eq("id", campaignId)
    .in("status", ["draft", "pending_approval", "scheduled", "queued"]);
  if (error) return { error: "save_failed" };

  await logAdminMutation({
    action: "update",
    entityType: "notification_campaign",
    entityId: campaignId,
    routeName: "notifications",
    context: { step: "cancel" },
  });
  return { ok: true };
}

export async function exportNotificationCampaignsCsv(
  filters: NotificationListFilters = {},
): Promise<{ csv: string } | { error: NotificationActionError }> {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "notifications.export", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" };
  }

  const rows = await listNotificationCampaigns(filters);
  const header = [
    "id",
    "title",
    "category",
    "priority",
    "status",
    "audience",
    "sent_at",
    "delivered",
    "opened",
    "failed",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      `"${row.title.replace(/"/g, '""')}"`,
      row.category,
      row.priority,
      row.status,
      row.recipient_count || row.estimated_audience_count,
      row.sent_at ?? "",
      row.delivered_count,
      row.opened_count,
      row.failed_count,
    ].join(","),
  );
  await logAdminRead("notifications", "export", filters as Record<string, unknown>);
  return { csv: [header.join(","), ...lines].join("\n") };
}

export async function saveNotificationTemplate(input: {
  name: string;
  category: string;
  titleTemplate: string;
  bodyTemplate: string;
  actionType?: string;
  actionParams?: Record<string, unknown>;
}): Promise<{ id: string } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { data, error } = await supabase
    .from("notification_templates")
    .insert({
      name: input.name.trim(),
      category: input.category,
      title_template: input.titleTemplate.trim(),
      body_template: input.bodyTemplate.trim(),
      action_type: input.actionType ?? "open_screen",
      action_params: input.actionParams ?? {},
      created_by: session.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "save_failed" };
  return { id: data.id };
}

export async function saveNotificationAutomation(input: {
  name: string;
  triggerType: string;
  category?: string;
  priority?: string;
  throttleMinutes?: number;
  cooldownMinutes?: number;
}): Promise<{ id: string } | { error: NotificationActionError }> {
  const session = await requireNotificationsManage();
  if (!session) return { error: "not_authorized" };

  const supabase = await notificationsDb();
  const { data, error } = await supabase
    .from("notification_automations")
    .insert({
      name: input.name.trim(),
      trigger_type: input.triggerType,
      category: input.category ?? "reminder",
      priority: input.priority ?? "normal",
      throttle_minutes: input.throttleMinutes ?? 60,
      cooldown_minutes: input.cooldownMinutes ?? 1440,
      status: "draft",
      created_by: session.id,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "save_failed" };
  return { id: data.id };
}

export async function listNotificationDispatchHistory(
  campaignId?: string,
): Promise<Array<Record<string, unknown>>> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  let query = supabase
    .from("notification_dispatch_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getNotificationRemoteConfig(): Promise<Record<string, unknown>> {
  await requireNotificationsView();
  const supabase = await notificationsDb();
  const { data } = await supabase
    .from("notification_remote_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (
    data ?? {
      id: 1,
      global_enabled: true,
      emergency_gate_enabled: true,
      category_throttles: {},
    }
  );
}

export async function processDueNotificationCampaigns(): Promise<{
  processed: number;
  errors: string[];
}> {
  const service = notificationsAdminDb();
  const now = new Date().toISOString();
  const { data: due } = await service
    .from("notification_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(20);

  let processed = 0;
  const errors: string[] = [];
  for (const row of due ?? []) {
    const result = await executeNotificationDispatch(row.id, null);
    if ("error" in result) errors.push(`${row.id}:${result.error}`);
    else processed += 1;
  }
  return { processed, errors };
}

export async function createNotificationAutomation(input: {
  name: string;
  triggerKey: string;
  cooldownSeconds?: number;
  throttlePerHour?: number;
  maxRetries?: number;
}): Promise<{ id: string } | { error: NotificationActionError }> {
  return saveNotificationAutomation({
    name: input.name,
    triggerType: input.triggerKey,
    cooldownMinutes: Math.ceil((input.cooldownSeconds ?? 900) / 60),
    throttleMinutes: Math.ceil(60 / Math.max(input.throttlePerHour ?? 100, 1)),
  });
}

export async function createNotificationTemplate(input: {
  key: string;
  name: string;
  category: string;
  titleTemplate: string;
  bodyTemplate: string;
}): Promise<{ template: { key: string; id: string } } | { error: NotificationActionError }> {
  const result = await saveNotificationTemplate({
    name: input.name,
    category: input.category,
    titleTemplate: input.titleTemplate,
    bodyTemplate: input.bodyTemplate,
  });
  if ("error" in result) return result;
  return { template: { key: input.key || input.name, id: result.id } };
}

export async function runNotificationWorkerNow(
  _limit?: number,
): Promise<
  | { processed: number; sent: number; failed: number; provider: string }
  | { error: NotificationActionError }
> {
  const session = await requireNotificationsSend();
  if (!session) return { error: "not_authorized" };
  const result = await processDueNotificationCampaigns();
  return {
    processed: result.processed,
    sent: result.processed,
    failed: result.errors.length,
    provider: "firebase_fcm",
  };
}
