"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Pause, Play, Save } from "lucide-react";
import { AppModalFooter } from "@/components/app/app-modal-footer";
import { AppListCard } from "@/components/app/app-list-card";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabBar } from "@/components/dashboard/tab-bar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_AUTOMATION_TRIGGERS,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "./constants";
import { NotificationTargetingFields } from "./notification-targeting-fields";
import {
  saveNotificationAutomation,
  setNotificationAutomationStatus,
  updateNotificationAutomation,
} from "./notifications-actions";
import {
  useNotificationAutomation,
  useNotificationAutomationRuns,
  useNotificationTemplates,
} from "./use-notifications";
import type {
  NotificationActionType,
  NotificationAutomationTrigger,
  NotificationCategory,
  NotificationPriority,
  TargetSpec,
} from "./types";

type SectionId = "trigger" | "conditions" | "audience" | "content" | "throttle" | "review";

export function AutomationBuilderPageShell({ automationId }: { automationId?: string }) {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const router = useRouter();
  const auth = useAuth();
  const canManage = auth.can("notifications.manage");
  const isEdit = Boolean(automationId);
  const [section, setSection] = useState<SectionId>("trigger");
  const [pending, startTransition] = useTransition();

  const { data: existing, isLoading, refetch } = useNotificationAutomation(automationId ?? null);
  const { data: runs } = useNotificationAutomationRuns(automationId ?? null);
  const { data: templates } = useNotificationTemplates();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<NotificationAutomationTrigger>("inactivity");
  const [triggerConfigJson, setTriggerConfigJson] = useState("{}");
  const [conditionSpecJson, setConditionSpecJson] = useState("{}");
  const [targetMode, setTargetMode] = useState<TargetSpec["mode"]>("all");
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [contentMode, setContentMode] = useState<"template" | "inline">("inline");
  const [templateId, setTemplateId] = useState<string>("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("reminder");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [actionType, setActionType] = useState<NotificationActionType>("open_screen");
  const [actionParamsJson, setActionParamsJson] = useState('{"screen":"home"}');
  const [throttleMinutes, setThrottleMinutes] = useState("60");
  const [cooldownMinutes, setCooldownMinutes] = useState("1440");
  const [maxRetries, setMaxRetries] = useState("3");

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? "");
    setTriggerType(existing.trigger_type);
    setTriggerConfigJson(JSON.stringify(existing.trigger_config ?? {}, null, 2));
    setConditionSpecJson(JSON.stringify(existing.condition_spec ?? {}, null, 2));
    const spec = existing.target_spec ?? { mode: "all" };
    setTargetMode(spec.mode ?? "all");
    setZoneIds(spec.zone_ids ?? []);
    setPartnerIds(spec.partner_ids ?? []);
    setDriverIds(spec.driver_ids ?? []);
    if (existing.template_id) {
      setContentMode("template");
      setTemplateId(existing.template_id);
    } else {
      setContentMode("inline");
    }
    setTitleTemplate(existing.title_template ?? "");
    setBodyTemplate(existing.body_template ?? "");
    setCategory(existing.category);
    setPriority(existing.priority);
    setActionType(existing.action_type);
    setActionParamsJson(JSON.stringify(existing.action_params ?? {}, null, 2));
    setThrottleMinutes(String(existing.throttle_minutes));
    setCooldownMinutes(String(existing.cooldown_minutes));
    setMaxRetries(String(existing.max_retries));
  }, [existing]);

  const targetSpec = useMemo<TargetSpec>(() => {
    if (targetMode === "zone") return { mode: "zone", zone_ids: zoneIds };
    if (targetMode === "partner") return { mode: "partner", partner_ids: partnerIds };
    if (targetMode === "custom") return { mode: "custom", driver_ids: driverIds };
    return { mode: targetMode };
  }, [targetMode, zoneIds, partnerIds, driverIds]);

  function buildInput() {
    let triggerConfig: Record<string, unknown> = {};
    let conditionSpec: Record<string, unknown> = {};
    let actionParams: Record<string, unknown> = {};
    try {
      triggerConfig = JSON.parse(triggerConfigJson) as Record<string, unknown>;
      conditionSpec = JSON.parse(conditionSpecJson) as Record<string, unknown>;
      actionParams = JSON.parse(actionParamsJson) as Record<string, unknown>;
    } catch {
      throw new Error("invalid_json");
    }

    return {
      name,
      description: description || null,
      triggerType,
      triggerConfig,
      conditionSpec,
      targetSpec,
      templateId: contentMode === "template" && templateId ? templateId : null,
      titleTemplate: contentMode === "inline" ? titleTemplate : null,
      bodyTemplate: contentMode === "inline" ? bodyTemplate : null,
      category,
      priority,
      actionType,
      actionParams,
      throttleMinutes: Number(throttleMinutes) || 60,
      cooldownMinutes: Number(cooldownMinutes) || 1440,
      maxRetries: Number(maxRetries) || 3,
    };
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error(t("errors.invalid_input"));
      setSection("trigger");
      return;
    }
    let input;
    try {
      input = buildInput();
    } catch {
      toast.error(t("errors.invalid_json"));
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateNotificationAutomation(automationId!, input)
        : await saveNotificationAutomation(input);
      if ("error" in result) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(isEdit ? t("automationUpdated") : t("automationCreated"));
      router.push(`/${locale}/notifications/automations/${result.id}`);
    });
  }

  function handleStatusChange(status: "active" | "paused" | "draft") {
    if (!automationId) return;
    startTransition(async () => {
      const result = await setNotificationAutomationStatus(automationId, status);
      if ("error" in result) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("automationStatusUpdated"));
      void refetch();
    });
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isEdit && !isLoading && !existing) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{t("automationNotFound")}</p>
    );
  }

  return (
    <AppPage narrow>
      <AppPageHeader
        title={isEdit ? t("automationEditTitle") : t("automationCreateTitle")}
        description={t("automationBuilderSubtitle")}
        breadcrumbs={[
          { label: t("title"), href: `/${locale}/notifications` },
          { label: t("navAutomations"), href: `/${locale}/notifications/automations` },
          { label: isEdit ? name || t("automationEditTitle") : t("automationCreateTitle") },
        ]}
        actions={
          isEdit && existing ? (
            <StatusPill
              variant={
                existing.status === "active"
                  ? "success"
                  : existing.status === "paused"
                    ? "warning"
                    : "neutral"
              }
            >
              {t(`automationStatuses.${existing.status}`)}
            </StatusPill>
          ) : null
        }
      />

      <TabBar
        items={[
          { id: "trigger", label: t("sectionTrigger") },
          { id: "conditions", label: t("sectionConditions") },
          { id: "audience", label: t("sectionRecipients") },
          { id: "content", label: t("sectionContent") },
          { id: "throttle", label: t("sectionThrottle") },
          { id: "review", label: t("sectionReview") },
        ]}
        activeId={section}
        onSelect={(id) => setSection(id as SectionId)}
      />

      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="space-y-3 p-4">
          {section === "trigger" ? (
            <>
              <div className="space-y-1">
                <Label>{t("fieldName")}</Label>
                <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldDescription")}</Label>
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldTrigger")}</Label>
                <Select
                  value={triggerType}
                  onValueChange={(v) => setTriggerType(v as NotificationAutomationTrigger)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_AUTOMATION_TRIGGERS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {t(`automationTriggers.${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("fieldTriggerConfig")}</Label>
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  value={triggerConfigJson}
                  onChange={(e) => setTriggerConfigJson(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("triggerConfigHint")}</p>
              </div>
            </>
          ) : null}

          {section === "conditions" ? (
            <>
              <p className="text-sm text-muted-foreground">{t("conditionsHint")}</p>
              <div className="space-y-1">
                <Label>{t("fieldConditionSpec")}</Label>
                <Textarea
                  rows={10}
                  className="font-mono text-xs"
                  value={conditionSpecJson}
                  onChange={(e) => setConditionSpecJson(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {section === "audience" ? (
            <NotificationTargetingFields
              targetMode={targetMode}
              zoneIds={zoneIds}
              partnerIds={partnerIds}
              driverIds={driverIds}
              onTargetModeChange={setTargetMode}
              onZoneIdsChange={setZoneIds}
              onPartnerIdsChange={setPartnerIds}
              onDriverIdsChange={setDriverIds}
            />
          ) : null}

          {section === "content" ? (
            <>
              <div className="space-y-1">
                <Label>{t("fieldContentSource")}</Label>
                <Select value={contentMode} onValueChange={(v) => setContentMode(v as "template" | "inline")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inline">{t("contentSourceInline")}</SelectItem>
                    <SelectItem value="template">{t("contentSourceTemplate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contentMode === "template" ? (
                <div className="space-y-1">
                  <Label>{t("fieldLinkedTemplate")}</Label>
                  <Select value={templateId} onValueChange={(v) => setTemplateId(v ?? "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t("selectTemplate")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(templates ?? []).map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>{t("fieldCategory")}</Label>
                      <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_CATEGORIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {t(`categories.${item}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>{t("fieldPriority")}</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as NotificationPriority)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_PRIORITIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {t(`priorities.${item}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("fieldTitleTemplate")}</Label>
                    <Input className="h-9" value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("fieldBodyTemplate")}</Label>
                    <Textarea rows={4} value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t("fieldActionType")}</Label>
                    <Select value={actionType} onValueChange={(v) => setActionType(v as NotificationActionType)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_ACTION_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {t(`actionTypes.${item}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("fieldActionParams")}</Label>
                    <Textarea
                      rows={4}
                      className="font-mono text-xs"
                      value={actionParamsJson}
                      onChange={(e) => setActionParamsJson(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          ) : null}

          {section === "throttle" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>{t("fieldThrottleMinutes")}</Label>
                <Input
                  className="h-9"
                  type="number"
                  min={1}
                  value={throttleMinutes}
                  onChange={(e) => setThrottleMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldCooldownMinutes")}</Label>
                <Input
                  className="h-9"
                  type="number"
                  min={1}
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldMaxRetries")}</Label>
                <Input
                  className="h-9"
                  type="number"
                  min={0}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {section === "review" ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-semibold">{name || "—"}</p>
                <p className="text-muted-foreground">{description || t("noDescription")}</p>
              </div>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">{t("fieldTrigger")}</dt>
                  <dd className="capitalize">{t(`automationTriggers.${triggerType}`)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("targetMode")}</dt>
                  <dd>{t(`targetModes.${targetMode}`)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("fieldThrottleMinutes")}</dt>
                  <dd>{throttleMinutes}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("fieldCooldownMinutes")}</dt>
                  <dd>{cooldownMinutes}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isEdit && runs?.length ? (
        <AppListCard title={t("automationRunHistory")} className="mt-4">
          <CardContent className="space-y-2 p-4">
            {runs.slice(0, 5).map((run) => (
              <div key={String(run.id)} className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="font-medium capitalize">{String(run.status)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("automationRunStats", {
                    matched: Number(run.matched_count ?? 0),
                    sent: Number(run.sent_count ?? 0),
                    failed: Number(run.failed_count ?? 0),
                  })}
                </p>
              </div>
            ))}
          </CardContent>
        </AppListCard>
      ) : null}

      <AppModalFooter
        asPage
        title={isEdit ? t("automationEditTitle") : t("automationCreateTitle")}
        subtitle={t("automationBuilderFooterHint")}
      >
        <Link
          href={`/${locale}/notifications/automations`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent"
        >
          {t("cancel")}
        </Link>
        {canManage && isEdit && existing?.status !== "active" ? (
          <Button
            variant="outline"
            className="h-9 cursor-pointer"
            disabled={pending}
            onClick={() => handleStatusChange("active")}
          >
            <Play className="size-4" />
            {t("activateAutomation")}
          </Button>
        ) : null}
        {canManage && isEdit && existing?.status === "active" ? (
          <Button
            variant="outline"
            className="h-9 cursor-pointer"
            disabled={pending}
            onClick={() => handleStatusChange("paused")}
          >
            <Pause className="size-4" />
            {t("pauseAutomation")}
          </Button>
        ) : null}
        {canManage ? (
          <Button className="h-9 cursor-pointer" disabled={pending} onClick={handleSave}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("saveAutomation")}
          </Button>
        ) : null}
      </AppModalFooter>
    </AppPage>
  );
}
