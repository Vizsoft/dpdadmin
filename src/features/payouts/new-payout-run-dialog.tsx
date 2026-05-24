"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useGeneratePayoutRun } from "./use-payouts";

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultStartDate() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function NewPayoutRunDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pages.payouts");
  const create = useGeneratePayoutRun();
  const [isPending, startTransition] = useTransition();
  const [periodStart, setPeriodStart] = useState(defaultStartDate);
  const [periodEnd, setPeriodEnd] = useState(defaultEndDate);
  const [notes, setNotes] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  const isDateRangeValid = useMemo(() => {
    if (!periodStart || !periodEnd) return false;
    return periodStart <= periodEnd;
  }, [periodStart, periodEnd]);

  useEffect(() => {
    if (!open) {
      setPeriodStart(defaultStartDate());
      setPeriodEnd(defaultEndDate());
      setNotes("");
      setDateError(null);
      return;
    }
    if (!isDateRangeValid) {
      setDateError(t("periodRangeInvalid"));
    } else {
      setDateError(null);
    }
  }, [open, isDateRangeValid, t]);

  const onSubmit = () => {
    if (!isDateRangeValid) {
      setDateError(t("periodRangeInvalid"));
      return;
    }
    startTransition(async () => {
      const result = await create.mutateAsync({
        periodStart,
        periodEnd,
        notes: notes.trim() || undefined,
      });
      if ("error" in result) {
        toast.error(t("runCreateFailed"), { description: result.error });
        return;
      }
      toast.success(t("runCreated"));
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader>
          <div className="border-b border-border px-5 py-4">
            <DialogTitle>{t("newRunTitle")}</DialogTitle>
            <DialogDescription className="mt-1">{t("newRunDescription")}</DialogDescription>
          </div>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payout-start">{t("periodStart")}</Label>
              <Input
                id="payout-start"
                type="date"
                value={periodStart}
                onChange={(e) => {
                  setPeriodStart(e.target.value);
                  setDateError(null);
                }}
                max={periodEnd || undefined}
                className={cn(dateError && "border-destructive")}
                aria-invalid={Boolean(dateError)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-end">{t("periodEnd")}</Label>
              <Input
                id="payout-end"
                type="date"
                value={periodEnd}
                onChange={(e) => {
                  setPeriodEnd(e.target.value);
                  setDateError(null);
                }}
                min={periodStart || undefined}
                className={cn(dateError && "border-destructive")}
                aria-invalid={Boolean(dateError)}
              />
            </div>
          </div>
          {dateError ? (
            <p className="text-sm text-destructive" role="alert">
              {dateError}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="payout-notes">{t("notes")}</Label>
            <Textarea
              id="payout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="min-h-28"
            />
          </div>
        </div>
        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !isDateRangeValid}>
            {isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t("creatingRun")}
              </>
            ) : (
              t("createRun")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
