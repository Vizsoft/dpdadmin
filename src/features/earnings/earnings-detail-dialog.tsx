"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { runGetEarningsDetail } from "./earnings-actions";
import type { EarningsDetailResult } from "@/features/dpd/types";

type EarningsDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string | null;
  earnDate: string | null;
  driverLabel?: string;
};

export function EarningsDetailDialog({
  open,
  onOpenChange,
  driverId,
  earnDate,
  driverLabel,
}: EarningsDetailDialogProps) {
  const t = useTranslations("pages.earningsCalculation");
  const [detail, setDetail] = useState<EarningsDetailResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !driverId || !earnDate) {
      setDetail(null);
      return;
    }
    startTransition(async () => {
      const result = await runGetEarningsDetail(driverId, earnDate);
      if ("error" in result) {
        setDetail(null);
        return;
      }
      setDetail(result);
    });
  }, [open, driverId, earnDate]);

  const daily = detail?.daily;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {t("detailTitle")} — {driverLabel ?? driverId?.slice(0, 8)} · {earnDate}
          </DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <section className="grid gap-2 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">{t("colBase")}</p>
                <p className="font-medium tabular-nums">{daily?.base_kwd ?? 0} KWD</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("colIncentive")}</p>
                <p className="font-medium tabular-nums">{daily?.incentive_kwd ?? 0} KWD</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("colDeliveries")}</p>
                <p className="font-medium tabular-nums">
                  {detail.eligible_deliveries_count} / {detail.deliveries.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("colNet")}</p>
                <p className="font-semibold tabular-nums">{daily?.net_kwd ?? 0} KWD</p>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("rulesApplied")}</h3>
              {detail.rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRules")}</p>
              ) : (
                <div className="space-y-2">
                  {detail.rules.map((rule, idx) => (
                    <div
                      key={`${rule.rule_id ?? rule.note ?? idx}`}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      {rule.note === "override_applied" ? (
                        <p className="font-medium text-amber-600 dark:text-amber-400">
                          {t("overrideApplied")}
                        </p>
                      ) : (
                        <>
                          <p className="font-medium">{rule.rule_name}</p>
                          <p className="text-muted-foreground">
                            {rule.period} · {t("eligibleCount", { count: rule.eligible_count ?? 0 })}
                          </p>
                          <p className="tabular-nums">{rule.amount_kwd ?? rule.reward_kwd} KWD</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">{t("ordersTitle")}</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colOrder")}</TableHead>
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colCounts")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">
                        {d.external_order_id ?? d.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {[d.partner_name, d.restaurant_name].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.counts_for_earnings ? t("countsYes") : t("countsNo")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("detailEmpty")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
