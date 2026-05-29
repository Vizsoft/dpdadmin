"use client";

import { useTranslations } from "next-intl";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { resolveStatusVariant } from "@/lib/ui/resolve-status-variant";
import type { WorkforceQueueRow } from "../types";
import { DashboardWidget } from "./dashboard-widget";

export function WorkforceQueueWidget({
  rows,
  locale,
}: {
  rows: WorkforceQueueRow[];
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget title={t("widgetWorkforceQueue")} href={`/${locale}/drivers`}>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className={TABLE_HEAD_CLASS}>{t("colDriver")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colDeliveries")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colLastActivity")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 12).map((row) => (
              <TableRow key={row.driverId}>
                <TableCell className="text-xs">
                  <p className="font-medium">{row.driverName}</p>
                  <p className="text-muted-foreground">#{row.driverCode}</p>
                </TableCell>
                <TableCell className="text-xs">
                  <p>{row.partnerName}</p>
                  <p className="text-muted-foreground">{row.restaurantName}</p>
                </TableCell>
                <TableCell>
                  <StatusPill variant={resolveStatusVariant(row.status)} dot>
                    {t(`workforceStatus.${row.status}`)}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-xs tabular-nums">{row.deliveriesToday}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.lastActivityAt
                    ? new Date(row.lastActivityAt).toLocaleTimeString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardWidget>
  );
}
