"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import type { AttendanceMonitorRow } from "../types";
import { DashboardWidget } from "./dashboard-widget";

export function AttendanceMonitorWidget({
  rows,
  locale,
}: {
  rows: AttendanceMonitorRow[];
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget title={t("widgetAttendance")} href={`/${locale}/attendance`}>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colScheduled")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colCheckedIn")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colLate")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colAbsent")}</TableHead>
              <TableHead className={TABLE_HEAD_CLASS}>{t("colOvertime")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 8).map((row) => (
              <TableRow key={row.partnerName}>
                <TableCell className="text-xs font-medium">{row.partnerName}</TableCell>
                <TableCell className="text-xs tabular-nums">{row.scheduled}</TableCell>
                <TableCell className="text-xs tabular-nums">{row.checkedIn}</TableCell>
                <TableCell className="text-xs tabular-nums">{row.late}</TableCell>
                <TableCell className="text-xs tabular-nums">{row.absent}</TableCell>
                <TableCell className="text-xs tabular-nums">{row.overtime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DashboardWidget>
  );
}
