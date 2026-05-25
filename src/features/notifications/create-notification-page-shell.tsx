"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Save, Send } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppModalFooter } from "@/components/app/app-modal-footer";
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
import { Checkbox } from "@/components/ui/checkbox";
import { TabBar } from "@/components/dashboard/tab-bar";
import { toast } from "sonner";
import {
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TARGET_MODES,
} from "./constants";
import { previewPayloadSchema, buildActionPayload } from "./payload-contract";
import {
  dispatchNotificationCampaign,
  estimateNotificationAudience,
  saveNotificationCampaign,
  scheduleNotificationCampaign,
} from "./notifications-actions";
import { useNotificationTargetingOptions } from "./use-notifications";
import type { NotificationActionType, NotificationCategory, NotificationPriority, TargetSpec } from "./types";

type SectionId = "recipients" | "content" | "action" | "schedule" | "preview";

export function CreateNotificationPageShell() {
  const t = useTranslations("pages.notifications");
  const locale = useLocale();
  const router = useRouter();
  const [section, setSection] = useState<SectionId>("recipients");
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("announcement");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [targetMode, setTargetMode] = useState<TargetSpec["mode"]>("all");
  const [zoneIds, setZoneIds] = useState<string[]>([]);
  const [partnerIds, setPartnerIds] = useState<string[]>([]);
  const [driverIds, setDriverIds] = useState<string[]>([]);
  const [actionType, setActionType] = useState<NotificationActionType>("open_screen");
  const [actionParamsJson, setActionParamsJson] = useState('{"screen":"home"}');
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const { data: targeting } = useNotificationTargetingOptions();

  const targetSpec = useMemo<TargetSpec>(() => {
    if (targetMode === "zone") return { mode: "zone", zone_ids: zoneIds };
    if (targetMode === "partner") return { mode: "partner", partner_ids: partnerIds };
    if (targetMode === "custom") return { mode: "custom", driver_ids: driverIds };
    return { mode: targetMode };
  }, [targetMode, zoneIds, partnerIds, driverIds]);

  const actionParams = useMemo(() => {
    try {
      return JSON.parse(actionParamsJson) as Record<string, unknown>;
    } catch {
      return {};
    }
  }, [actionParamsJson]);

  const payloadPreview = useMemo(
    () =>
      previewPayloadSchema(
        buildActionPayload({ actionType, actionParams }),
      ),
    [actionType, actionParams],
  );

  async function refreshAudience() {
    const count = await estimateNotificationAudience(targetSpec);
    setAudienceCount(count);
  }

  function buildInput() {
    return {
      title,
      body,
      category,
      priority,
      targetSpec,
      actionType,
      actionParams,
      scheduleSpec: {
        mode: scheduleMode,
        scheduled_for: scheduleMode === "later" ? scheduledFor || null : null,
      },
    };
  }

  function handleSaveDraft() {
    startTransition(async () => {
      const result = await saveNotificationCampaign(buildInput());
      if ("error" in result) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      toast.success(t("savedDraft"));
      router.push(`/${locale}/notifications/${result.id}`);
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const saved = await saveNotificationCampaign(buildInput());
      if ("error" in saved) {
        toast.error(t("errors.saveFailed"));
        return;
      }
      if (scheduleMode === "now") {
        const sent = await dispatchNotificationCampaign(saved.id);
        if ("error" in sent) {
          toast.error(t(`errors.${sent.error}`));
          router.push(`/${locale}/notifications/${saved.id}`);
          return;
        }
        toast.success(t("sentSuccess", { sent: sent.sent, failed: sent.failed }));
      } else {
        const scheduled = await scheduleNotificationCampaign(saved.id);
        if ("error" in scheduled) {
          toast.error(t("errors.saveFailed"));
          router.push(`/${locale}/notifications/${saved.id}`);
          return;
        }
        toast.success(t("scheduledSuccess"));
      }
      router.push(`/${locale}/notifications/${saved.id}`);
    });
  }

  return (
    <AppPage narrow>
      <AppPageHeader
        title={t("createTitle")}
        description={t("createSubtitle")}
        breadcrumbs={[
          { label: t("title"), href: `/${locale}/notifications` },
          { label: t("createTitle") },
        ]}
      />

      <TabBar
        items={[
          { id: "recipients", label: t("sectionRecipients") },
          { id: "content", label: t("sectionContent") },
          { id: "action", label: t("sectionAction") },
          { id: "schedule", label: t("sectionSchedule") },
          { id: "preview", label: t("sectionPreview") },
        ]}
        activeId={section}
        onSelect={(id) => setSection(id as SectionId)}
      />

      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="space-y-3 p-4">
          {section === "recipients" ? (
            <>
              <div className="space-y-1">
                <Label>{t("targetMode")}</Label>
                <Select value={targetMode} onValueChange={(v) => setTargetMode(v as TargetSpec["mode"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TARGET_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {t(`targetModes.${mode}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {targetMode === "zone" ? (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {(targeting?.zones ?? []).map((z) => (
                    <label key={z.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={zoneIds.includes(z.id)}
                        onCheckedChange={(checked) =>
                          setZoneIds((prev) =>
                            checked ? [...prev, z.id] : prev.filter((id) => id !== z.id),
                          )
                        }
                      />
                      {z.name}
                    </label>
                  ))}
                </div>
              ) : null}
              {targetMode === "partner" ? (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {(targeting?.partners ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={partnerIds.includes(p.id)}
                        onCheckedChange={(checked) =>
                          setPartnerIds((prev) =>
                            checked ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                          )
                        }
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              ) : null}
              {targetMode === "custom" ? (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                  {(targeting?.drivers ?? []).map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={driverIds.includes(d.id)}
                        onCheckedChange={(checked) =>
                          setDriverIds((prev) =>
                            checked ? [...prev, d.id] : prev.filter((id) => id !== d.id),
                          )
                        }
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <p className="text-sm text-muted-foreground">
                  {audienceCount == null
                    ? t("audienceEstimateHint")
                    : t("audienceEstimate", { count: audienceCount })}
                </p>
                <Button variant="outline" size="sm" className="h-9 cursor-pointer" onClick={() => void refreshAudience()}>
                  {t("estimateAudience")}
                </Button>
              </div>
            </>
          ) : null}

          {section === "content" ? (
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
                <Label>{t("fieldTitle")}</Label>
                <Input className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("fieldBody")}</Label>
                <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            </>
          ) : null}

          {section === "action" ? (
            <>
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
                  rows={6}
                  className="font-mono text-xs"
                  value={actionParamsJson}
                  onChange={(e) => setActionParamsJson(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {section === "schedule" ? (
            <>
              <div className="space-y-1">
                <Label>{t("fieldScheduleMode")}</Label>
                <Select value={scheduleMode} onValueChange={(v) => setScheduleMode(v as "now" | "later")}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="now">{t("scheduleNow")}</SelectItem>
                    <SelectItem value="later">{t("scheduleLater")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scheduleMode === "later" ? (
                <div className="space-y-1">
                  <Label>{t("fieldScheduledFor")}</Label>
                  <Input
                    className="h-9"
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {section === "preview" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-accent">{t("previewMessage")}</p>
                <p className="mt-1 text-sm font-semibold">{title || t("previewTitlePlaceholder")}</p>
                <p className="text-sm text-muted-foreground">{body || t("previewBodyPlaceholder")}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-accent">{t("previewPayload")}</p>
                <pre className="mt-2 overflow-x-auto text-xs">{payloadPreview}</pre>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AppModalFooter title={t("createTitle")} subtitle={t("createFooterHint")}>
        <Link
          href={`/${locale}/notifications`}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs hover:bg-accent"
        >
          {t("cancel")}
        </Link>
        <Button variant="outline" className="h-9 cursor-pointer" disabled={pending} onClick={handleSaveDraft}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("saveDraft")}
        </Button>
        <Button className="h-9 cursor-pointer" disabled={pending} onClick={handleSubmit}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {scheduleMode === "now" ? t("sendNow") : t("scheduleSend")}
        </Button>
      </AppModalFooter>
    </AppPage>
  );
}
