"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NotificationCampaign } from "./types";

export function NotificationHistoryShell({
  locale,
  campaigns,
}: {
  locale: string;
  campaigns: NotificationCampaign[];
}) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  const filtered = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const matchesQuery =
          !query ||
          campaign.title.toLowerCase().includes(query.toLowerCase()) ||
          campaign.category.toLowerCase().includes(query.toLowerCase());
        const matchesState =
          stateFilter === "all" || campaign.status === stateFilter;
        return matchesQuery && matchesState;
      }),
    [campaigns, query, stateFilter],
  );

  return (
    <AppPage>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Notification History</h1>
          <p className="text-sm text-muted-foreground">
            Search lifecycle timeline, duplicate/resend candidates, and state changes.
          </p>
        </div>
        <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Lifecycle filters, quick search, and operational triage.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input
            className="h-9"
            placeholder="Search campaign or category"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
          >
            <option value="all">All states</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending approval</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <div className="flex items-center text-xs text-muted-foreground">
            Showing {filtered.length} of {campaigns.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Timeline Index</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.title}</TableCell>
                  <TableCell>{campaign.status}</TableCell>
                  <TableCell>{campaign.priority}</TableCell>
                  <TableCell>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "-"}</TableCell>
                  <TableCell>{new Date(campaign.updated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/${locale}/notifications/${campaign.id}`} />}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No campaigns match this filter.
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
