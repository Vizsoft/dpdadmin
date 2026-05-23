"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppPage } from "@/components/app/app-page";
import { AppListCard } from "@/components/app/app-list-card";
import {
  AppDataTable,
  AppDataTableEmpty,
  AppDataTableRow,
  TableCell,
} from "@/components/app/app-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runListDriverEarningsDaily } from "@/features/dpd/dpd-actions";
import { EarningsDetailSheet } from "@/features/dpd/earnings-detail-sheet";
import type { EarningsDailyListRow } from "@/features/dpd/types";

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function EarningsPageShell() {
  const t = useTranslations("pages.earnings");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [rows, setRows] = useState<EarningsDailyListRow[]>([]);
  const [detailDriverId, setDetailDriverId] = useState<string | null>(null);
  const [detailEarnDate, setDetailEarnDate] = useState<string | null>(null);
  const [detailLabel, setDetailLabel] = useState<string>("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadRows = useCallback(() => {
    startTransition(async () => {
      const result = await runListDriverEarningsDaily(startDate, endDate);
      if ("error" in result) {
        toast.error(t("loadFailed"));
        return;
      }
      setRows(result.rows);
    });
  }, [startDate, endDate, t]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const openDetail = (row: EarningsDailyListRow) => {
    setDetailDriverId(row.driver_id);
    setDetailEarnDate(row.earn_date);
    setDetailLabel(`${row.driver_name} (${row.driver_code})`);
    setDetailOpen(true);
  };

  const totalNet = rows.reduce((sum, r) => sum + Number(r.net_kwd), 0);
  const totalWallet = rows.reduce(
    (sum, r) => sum + Number(r.wallet_amount_kwd ?? 0),
    0,
  );

  return (
    <AppPage>
      <AppListCard
        title={t("title")}
        description={t("subtitle")}
        headerActions={
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            onClick={loadRows}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t("loadData")}
          </Button>
        }
      >
        <div className="p-4">
        <div className="mb-4 flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="earn-start">{t("startDate")}</Label>
            <Input
              id="earn-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40 rounded-lg"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="earn-end">{t("endDate")}</Label>
            <Input
              id="earn-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40 rounded-lg"
            />
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{t("kpiRows")}</p>
            <p className="text-lg font-semibold tabular-nums">{rows.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{t("kpiTotalPaid")}</p>
            <p className="text-lg font-semibold tabular-nums">{totalNet.toFixed(3)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{t("kpiWalletApproved")}</p>
            <p className="text-lg font-semibold tabular-nums">{totalWallet.toFixed(3)}</p>
          </div>
        </div>

        <AppDataTable
          columns={[
            { id: "driver", label: t("colDriver") },
            { id: "date", label: t("colDate") },
            { id: "deliveries", label: t("colDeliveries") },
            { id: "incentive", label: t("colIncentive") },
            { id: "net", label: t("colNet") },
            { id: "wallet", label: t("colWallet") },
          ]}
          empty={
            rows.length === 0 ? (
              <AppDataTableEmpty>{t("emptyTitle")}</AppDataTableEmpty>
            ) : undefined
          }
        >
          {rows.map((row) => (
              <AppDataTableRow
                key={`${row.driver_id}-${row.earn_date}`}
                className="cursor-pointer"
                onClick={() => openDetail(row)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{row.driver_name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{row.driver_code}</p>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{row.earn_date}</TableCell>
                <TableCell className="tabular-nums">{row.deliveries}</TableCell>
                <TableCell className="tabular-nums">{row.incentive_kwd}</TableCell>
                <TableCell className="tabular-nums font-medium">{row.net_kwd}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {row.wallet_amount_kwd ?? "—"}
                </TableCell>
              </AppDataTableRow>
            ))
          }
        </AppDataTable>
        </div>
      </AppListCard>

      <EarningsDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        driverId={detailDriverId}
        earnDate={detailEarnDate}
        driverLabel={detailLabel}
      />
    </AppPage>
  );
}
