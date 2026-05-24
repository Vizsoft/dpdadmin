"use client";

import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DriverPayoutLine } from "./types";

export function PayoutLineDetailDialog({
  open,
  onOpenChange,
  line,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: DriverPayoutLine | null;
}) {
  const t = useTranslations("pages.payouts");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("lineDetailTitle")} {line ? `— ${line.driver_name} (${line.driver_code})` : ""}
          </DialogTitle>
        </DialogHeader>
        {line ? (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <p>Base: {line.base_kwd} KWD</p>
              <p>Incentive: {line.incentive_kwd} KWD</p>
              <p>Loan: {line.loan_deduction_kwd} KWD</p>
              <p>Penalty: {line.penalty_kwd} KWD</p>
              <p>Reimbursement: {line.reimbursement_kwd} KWD</p>
              <p>Net: {line.net_payable_kwd} KWD</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 font-medium">{t("rulesBreakdown")}</p>
              <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(line.breakdown_snapshot ?? [], null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
