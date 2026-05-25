"use client";

import Link from "next/link";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AnalyticsRow = {
  metric_date: string;
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  unique_recipients: number;
};

export function NotificationAnalyticsShell({
  locale,
  rows,
}: {
  locale: string;
  rows: AnalyticsRow[];
}) {
  const totals = rows.reduce(
    (acc, row) => ({
      sent: acc.sent + Number(row.sent_count ?? 0),
      delivered: acc.delivered + Number(row.delivered_count ?? 0),
      opened: acc.opened + Number(row.opened_count ?? 0),
      clicked: acc.clicked + Number(row.clicked_count ?? 0),
      failed: acc.failed + Number(row.failed_count ?? 0),
    }),
    { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
  );
  const deliveryRate = totals.sent ? ((totals.delivered / totals.sent) * 100).toFixed(1) : "0.0";
  const openRate = totals.delivered ? ((totals.opened / totals.delivered) * 100).toFixed(1) : "0.0";
  const ctr = totals.opened ? ((totals.clicked / totals.opened) * 100).toFixed(1) : "0.0";

  return (
    <AppPage>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notification Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Delivery funnel, trend facts, and segmentation-ready export source.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href={`/${locale}/notifications/history`} />} variant="outline" className="h-9">
            History
          </Button>
          <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        <AnalyticsStat label="Sent" value={totals.sent} />
        <AnalyticsStat label="Delivered" value={totals.delivered} />
        <AnalyticsStat label="Delivery Rate" value={`${deliveryRate}%`} />
        <AnalyticsStat label="Open Rate" value={`${openRate}%`} />
        <AnalyticsStat label="CTR" value={`${ctr}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Facts</CardTitle>
          <CardDescription>
            Backed by dispatch-event fact tables for export/reporting and campaign comparison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Clicked</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Recipients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.metric_date}:${row.campaign_id}`}>
                  <TableCell>{row.metric_date}</TableCell>
                  <TableCell className="max-w-[280px] truncate">{row.campaign_id}</TableCell>
                  <TableCell>{row.sent_count}</TableCell>
                  <TableCell>{row.delivered_count}</TableCell>
                  <TableCell>{row.opened_count}</TableCell>
                  <TableCell>{row.clicked_count}</TableCell>
                  <TableCell>{row.failed_count}</TableCell>
                  <TableCell>{row.unique_recipients}</TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No analytics rows yet. Run worker and refresh analytics from campaign details.
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

function AnalyticsStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
