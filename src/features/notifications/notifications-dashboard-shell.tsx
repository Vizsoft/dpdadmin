"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NotificationCampaign, NotificationDashboardMetrics } from "./types";
import { runNotificationWorkerNow } from "./notifications-actions";

export function NotificationsDashboardShell({
  locale,
  metrics,
  campaigns,
}: {
  locale: string;
  metrics: NotificationDashboardMetrics;
  campaigns: NotificationCampaign[];
}) {
  const [workerResult, setWorkerResult] = useState<string>("");
  const [running, startTransition] = useTransition();

  return (
    <AppPage>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Notification Center</h1>
          <p className="text-sm text-muted-foreground">
            Firebase-backed campaigns, dispatch, automations, analytics, and governance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href={`/${locale}/notifications/history`} />} variant="outline" className="h-9">
            History
          </Button>
          <Button render={<Link href={`/${locale}/notifications/analytics`} />} variant="outline" className="h-9">
            Analytics
          </Button>
          <Button render={<Link href={`/${locale}/notifications/new`} />} className="h-9">
            Create Notification
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <MetricCard label="Sent Today" value={metrics.sentToday} />
        <MetricCard label="Scheduled" value={metrics.scheduled} />
        <MetricCard label="Drafts" value={metrics.drafts} />
        <MetricCard label="Pending Approval" value={metrics.pendingApproval ?? 0} />
        <MetricCard label="Delivery Rate" value={`${metrics.deliveryRate}%`} />
        <MetricCard label="Failed Deliveries" value={metrics.failedDeliveries} />
        <MetricCard label="Open Rate" value={`${metrics.openRate}%`} />
        <MetricCard label="Active Automations" value={metrics.activeAutomations} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Dispatch Control</CardTitle>
              <CardDescription>
                Manually run queue worker when needed for urgent processing.
              </CardDescription>
            </div>
            <Button
              className="h-9"
              disabled={running}
              onClick={() =>
                startTransition(async () => {
                  const result = await runNotificationWorkerNow(200);
                  if ("error" in result) {
                    setWorkerResult(`Worker error: ${result.error}`);
                  } else {
                    setWorkerResult(
                      `Processed ${result.processed} items via ${result.provider} (sent ${result.sent}, failed ${result.failed}).`,
                    );
                  }
                })
              }
            >
              {running ? "Running..." : "Run Worker"}
            </Button>
          </div>
        </CardHeader>
        {workerResult ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{workerResult}</p>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>Latest lifecycle activity and delivery readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{campaign.priority}</TableCell>
                  <TableCell>{campaign.lifecycle_state}</TableCell>
                  <TableCell>{campaign.audience_estimate}</TableCell>
                  <TableCell>{campaign.send_at ? new Date(campaign.send_at).toLocaleString() : "Immediate"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/${locale}/notifications/${campaign.id}`} />}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No campaigns yet.
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

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
