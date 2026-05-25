"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createNotificationAutomation } from "./notifications-actions";
import type { NotificationAutomation } from "./types";

const PRESET_TRIGGERS = [
  "inactivity",
  "attendance_approval",
  "salary_processed",
  "document_expiry",
  "low_performance",
  "incentive_unlocked",
  "shift_reminder",
  "missed_submission",
] as const;

export function NotificationAutomationsShell({
  locale,
  automations,
}: {
  locale: string;
  automations: NotificationAutomation[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [triggerKey, setTriggerKey] = useState<string>(PRESET_TRIGGERS[0]);
  const [cooldownSeconds, setCooldownSeconds] = useState("900");
  const [throttlePerHour, setThrottlePerHour] = useState("100");
  const [maxRetries, setMaxRetries] = useState("3");
  const [result, setResult] = useState("");

  return (
    <AppPage>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Automation Builder</h1>
          <p className="text-sm text-muted-foreground">
            Event/rule triggers with throttling, retries, cooldowns, and failure controls.
          </p>
        </div>
        <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Automation</CardTitle>
          <CardDescription>Create rule-driven campaigns without manual dispatch work.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <AutomationField label="Name">
            <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} />
          </AutomationField>
          <AutomationField label="Trigger">
            <select
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={triggerKey}
              onChange={(e) => setTriggerKey(e.target.value)}
            >
              {PRESET_TRIGGERS.map((trigger) => (
                <option key={trigger} value={trigger}>
                  {trigger}
                </option>
              ))}
            </select>
          </AutomationField>
          <AutomationField label="Cooldown (sec)">
            <Input className="h-9" value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} />
          </AutomationField>
          <AutomationField label="Throttle / hour">
            <Input className="h-9" value={throttlePerHour} onChange={(e) => setThrottlePerHour(e.target.value)} />
          </AutomationField>
          <AutomationField label="Max retries">
            <Input className="h-9" value={maxRetries} onChange={(e) => setMaxRetries(e.target.value)} />
          </AutomationField>
          <div className="flex items-end gap-2 md:col-span-3">
            <Button
              className="h-9"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const response = await createNotificationAutomation({
                    name,
                    triggerKey,
                    cooldownSeconds: Number(cooldownSeconds),
                    throttlePerHour: Number(throttlePerHour),
                    maxRetries: Number(maxRetries),
                  });
                  if ("error" in response) {
                    setResult(`Failed: ${response.error}`);
                  } else {
                    setResult("Automation created.");
                    setName("");
                    router.refresh();
                  }
                })
              }
            >
              {pending ? "Saving..." : "Create automation"}
            </Button>
            {result ? <span className="text-sm text-muted-foreground">{result}</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cooldown</TableHead>
                <TableHead>Throttle/hr</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Last Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((automation) => (
                <TableRow key={automation.id}>
                  <TableCell className="font-medium">{automation.name}</TableCell>
                  <TableCell>{automation.trigger_key}</TableCell>
                  <TableCell>{automation.status}</TableCell>
                  <TableCell>{automation.cooldown_seconds}</TableCell>
                  <TableCell>{automation.throttle_per_hour}</TableCell>
                  <TableCell>{automation.max_retries}</TableCell>
                  <TableCell>
                    {automation.last_run_at ? new Date(automation.last_run_at).toLocaleString() : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {!automations.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No automations configured.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppPage>
  );
}

function AutomationField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
