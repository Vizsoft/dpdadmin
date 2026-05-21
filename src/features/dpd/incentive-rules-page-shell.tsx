"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
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
import { IncentiveRuleFormSheet } from "./incentive-rule-form-sheet";
import {
  formatIncentiveRewardSummary,
  formatIncentiveTargetSummary,
  type IncentiveRuleRow,
} from "./types";
import { useDpdScopeOptions, useIncentiveRules } from "./use-dpd";

export function IncentiveRulesPageShell() {
  const t = useTranslations("pages.dpd");
  const tPage = useTranslations("pages.incentiveRules");
  const { can } = useAuth();
  const canManage = can("earnings.manage");

  const { data: scopeOptions } = useDpdScopeOptions();
  const { data: incentiveRules, isLoading } = useIncentiveRules();

  const [sheet, setSheet] = useState<{ open: boolean; row: IncentiveRuleRow | null }>({
    open: false,
    row: null,
  });

  return (
    <AppPage>
      <AppPageHeader title={tPage("title")} description={tPage("subtitle")} />

      <p className="text-sm text-muted-foreground">{t("stackingHint")}</p>

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
              {t("addIncentiveRule")}
            </Button>
          ) : null
        }
      >
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (incentiveRules?.length ?? 0) === 0 ? (
          <AppEmptyState title={t("emptyIncentiveRules")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colScope")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colPeriod")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colTarget")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colReward")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                {canManage ? (
                  <TableHead className={cn(TABLE_HEAD_CLASS, "w-24 text-end")}>
                    {t("edit")}
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(incentiveRules ?? []).map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.scope_label}</TableCell>
                  <TableCell>{t(`period.${row.period}`)}</TableCell>
                  <TableCell>
                    {formatIncentiveTargetSummary(row, (key, values) =>
                      t(key, values),
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {formatIncentiveRewardSummary(row, (key, values) =>
                      t(key, values),
                    )}
                  </TableCell>
                  <TableCell>
                    <DpdStatusBadge status={row.status} />
                  </TableCell>
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

      <IncentiveRuleFormSheet
        rule={sheet.row}
        options={scopeOptions}
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
      />
    </AppPage>
  );
}
