"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  approveNotificationCampaign,
  cloneNotificationCampaign,
  dispatchNotificationCampaign,
  submitNotificationForApproval,
} from "./notifications-actions";
import type { NotificationCampaign } from "./types";

export function NotificationDetailShell({
  locale,
  campaign,
  timeline,
  events,
}: {
  locale: string;
  campaign: NotificationCampaign;
  timeline: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <AppPage>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {campaign.category} · {campaign.priority} · {campaign.lifecycle_state}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
            Back
          </Button>
          <Button
            variant="outline"
            className="h-9"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cloneNotificationCampaign(campaign.id);
                if ("error" in result) {
                  setMessage(`Clone failed: ${result.error}`);
                  return;
                }
                router.push(`/${locale}/notifications/${result.id}`);
              })
            }
          >
            Clone
          </Button>
          <Button
            variant="outline"
            className="h-9"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await dispatchNotificationCampaign(campaign.id);
                setMessage(
                  "error" in result
                    ? `Failed: ${result.error}`
                    : `Dispatched (sent ${result.sent}, failed ${result.failed}).`,
                );
                router.refresh();
              })
            }
          >
            Send / Queue Dispatch
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Controls</CardTitle>
          <CardDescription>
            Approval routing is required for high/broadcast/emergency campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            className="h-9"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await submitNotificationForApproval(campaign.id);
                setMessage("error" in result ? `Failed: ${result.error}` : "Submitted for approval.");
                router.refresh();
              })
            }
          >
            Submit Approval
          </Button>
          <Button
            className="h-9"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await approveNotificationCampaign(campaign.id);
                setMessage("error" in result ? `Failed: ${result.error}` : "Campaign approved.");
                router.refresh();
              })
            }
          >
            Approve
          </Button>
          <Button
            className="h-9"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await dispatchNotificationCampaign(campaign.id);
                setMessage(
                  "error" in result
                    ? `Failed: ${result.error}`
                    : `Queued dispatch (sent ${result.sent}, failed ${result.failed}).`,
                );
                router.refresh();
              })
            }
          >
            Queue Dispatch
          </Button>
          {message ? <span className="self-center text-sm text-muted-foreground">{message}</span> : null}
        </CardContent>
      </Card>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payload Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
              {JSON.stringify(
                {
                  title: campaign.title,
                  body: campaign.body,
                  actionPayload: campaign.action_params,
                  dataPayload: campaign.target_spec,
                  version: campaign.payload_version ?? 1,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Targeting Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
              {JSON.stringify(
                {
                  targetSpec: campaign.target_spec,
                  exclusionSpec: campaign.exclusion_spec,
                  audienceEstimate: campaign.estimated_audience_count,
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeline.map((item) => (
                <TableRow key={String(item.id)}>
                  <TableCell>{String(item.action ?? "-")}</TableCell>
                  <TableCell>{String(item.state_from ?? "-")}</TableCell>
                  <TableCell>{String(item.state_to ?? "-")}</TableCell>
                  <TableCell>{new Date(String(item.created_at)).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!timeline.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No timeline entries yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((item) => (
                <TableRow key={String(item.id)}>
                  <TableCell>{String(item.event_type ?? "-")}</TableCell>
                  <TableCell>{String(item.recipient_id ?? "-")}</TableCell>
                  <TableCell>{new Date(String(item.event_at)).toLocaleString()}</TableCell>
                  <TableCell className="max-w-[420px] truncate">{JSON.stringify(item.metadata ?? {})}</TableCell>
                </TableRow>
              ))}
              {!events.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No provider events yet.
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
