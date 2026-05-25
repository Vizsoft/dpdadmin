"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveNotificationCampaign } from "./notifications-actions";
import { NOTIFICATION_PRIORITIES } from "./constants";
import type { NotificationCategory, NotificationPriority } from "./types";

export function NotificationCreateForm({ locale }: { locale: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<NotificationCategory>("operations");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetSpecText, setTargetSpecText] = useState(
    JSON.stringify({ mode: "all", filters: {} }, null, 2),
  );
  const [exclusionSpecText, setExclusionSpecText] = useState(
    JSON.stringify({ users: [], teams: [] }, null, 2),
  );
  const [actionPayloadText, setActionPayloadText] = useState(
    JSON.stringify({ action: "open_screen", route: "/home" }, null, 2),
  );
  const [dataPayloadText, setDataPayloadText] = useState(
    JSON.stringify({ source: "admin_notification_center", version: 1 }, null, 2),
  );
  const [sendMode, setSendMode] = useState<"now" | "at" | "recurring">("now");
  const [sendAt, setSendAt] = useState("");
  const [recurringRule, setRecurringRule] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kuwait");
  const [expiresAt, setExpiresAt] = useState("");
  const [result, setResult] = useState("");

  const payloadPreview = useMemo(
    () => ({
      title,
      body,
      actionPayload: safeJson(actionPayloadText),
      dataPayload: safeJson(dataPayloadText),
      version: 1,
    }),
    [actionPayloadText, body, dataPayloadText, title],
  );

  return (
    <AppPage className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create Notification</h1>
          <p className="text-sm text-muted-foreground">
            Build targeted campaigns with approval-aware lifecycle and dispatch contracts.
          </p>
        </div>
        <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipients</CardTitle>
          <CardDescription>
            Use dynamic rules and explicit exclusions for live audience targeting.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Campaign name">
            <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Category">
            <Input
              className="h-9"
              value={category}
              onChange={(e) => setCategory(e.target.value as NotificationCategory)}
            />
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as NotificationPriority)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              {NOTIFICATION_PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <Input className="h-9" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </Field>
          <Field label="Targeting spec JSON">
            <Textarea
              rows={7}
              value={targetSpecText}
              onChange={(e) => setTargetSpecText(e.target.value)}
            />
          </Field>
          <Field label="Exclusions JSON">
            <Textarea
              rows={7}
              value={exclusionSpecText}
              onChange={(e) => setExclusionSpecText(e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content and Action Payload</CardTitle>
          <CardDescription>
            Define message body, deep-link action, and platform-agnostic data payload.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <Input className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Body">
            <Input className="h-9" value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <Field label="Action payload JSON">
            <Textarea
              rows={7}
              value={actionPayloadText}
              onChange={(e) => setActionPayloadText(e.target.value)}
            />
          </Field>
          <Field label="Data payload JSON">
            <Textarea
              rows={7}
              value={dataPayloadText}
              onChange={(e) => setDataPayloadText(e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling and Delivery Policy</CardTitle>
          <CardDescription>
            Configure send now/later/recurring plus expiry and quiet-hours safe execution.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Field label="Send mode">
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={sendMode}
              onChange={(e) => setSendMode(e.target.value as "now" | "at" | "recurring")}
            >
              <option value="now">Now</option>
              <option value="at">Schedule At</option>
              <option value="recurring">Recurring</option>
            </select>
          </Field>
          <Field label="Send at (UTC ISO)">
            <Input
              className="h-9"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              placeholder="2026-06-30T12:30:00Z"
            />
          </Field>
          <Field label="Recurring rule (RRULE)">
            <Input
              className="h-9"
              value={recurringRule}
              onChange={(e) => setRecurringRule(e.target.value)}
              placeholder="FREQ=DAILY;INTERVAL=1"
            />
          </Field>
          <Field label="Expiry (UTC ISO)">
            <Input
              className="h-9"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              placeholder="2026-07-01T00:00:00Z"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payload Preview Contract (v1)</CardTitle>
          <CardDescription>
            Mobile handoff uses this stable versioned schema for deep links and event callbacks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
            {JSON.stringify(payloadPreview, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {result ? <span className="text-sm text-muted-foreground">{result}</span> : null}
        <Button
          className="h-9"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const response = await saveNotificationCampaign({
                title: title || name,
                body,
                category,
                priority,
                targetSpec: safeJson(targetSpecText) as { mode: "all" },
                exclusionSpec: safeJson(exclusionSpecText),
                actionType: "open_screen",
                actionParams: safeJson(actionPayloadText),
                scheduleSpec: {
                  mode: sendMode === "at" ? "later" : "now",
                  scheduled_for: sendMode === "at" ? sendAt || null : null,
                  recurring_rule: sendMode === "recurring" ? recurringRule || null : null,
                },
                timezone,
                expiresAt: expiresAt || null,
              });
              if ("error" in response) {
                setResult(`Create failed: ${response.error}`);
                return;
              }
              setResult("Campaign created.");
              router.push(`/${locale}/notifications/${response.id}`);
            })
          }
        >
          {pending ? "Saving..." : "Create campaign"}
        </Button>
      </div>
    </AppPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function safeJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}
