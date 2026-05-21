"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { AppListCard } from "@/components/app/app-list-card";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DpdStatusBadge } from "./dpd-status-badge";
import { RuleFormSheet } from "./rule-form-sheet";
import type { DeliveryRuleRow } from "./types";
import { useDeliveryRules, useDpdScopeOptions } from "./use-dpd";

export function DeliveryRulesPageShell() {
  const t = useTranslations("pages.dpd");
  const { can } = useAuth();
  const canManage = can("earnings.manage");

  const { data: scopeOptions } = useDpdScopeOptions();
  const { data: deliveryRules, isLoading } = useDeliveryRules();

  const [sheet, setSheet] = useState<{ open: boolean; row: DeliveryRuleRow | null }>({
    open: false,
    row: null,
  });

  return (
    <AppPage>
      <AppListCard
        headerActions={
          canManage ? (
            <Button
              type="button"
              size="sm"
              className="cursor-pointer rounded-lg"
              onClick={() => setSheet({ open: true, row: null })}
            >
              <Plus className="h-4 w-4" />
              {t("addDeliveryRule")}
            </Button>
          ) : null
        }
      >
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (deliveryRules?.length ?? 0) === 0 ? (
          <AppEmptyState title={t("emptyDeliveryRules")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colScope")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colDates")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colPriority")}</TableHead>
                {canManage ? (
                  <TableHead className={cn(TABLE_HEAD_CLASS, "w-24 text-end")}>
                    {t("edit")}
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deliveryRules ?? []).map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.scope_label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.start_date} → {row.end_date}
                  </TableCell>
                  <TableCell>
                    <DpdStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{row.priority}</TableCell>
                  {canManage ? (
                    <TableCell className="text-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer"
                        onClick={() => setSheet({ open: true, row })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AppListCard>

      <RuleFormSheet
        rule={sheet.row}
        options={scopeOptions}
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
      />
    </AppPage>
  );
}
