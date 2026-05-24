"use client";

import { useState, useTransition } from "react";
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

  const onSubmit = () => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newRunTitle")}</DialogTitle>
          <DialogDescription>{t("newRunDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="payout-start">{t("periodStart")}</Label>
              <Input
                id="payout-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-end">{t("periodEnd")}</Label>
              <Input
                id="payout-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payout-notes">{t("notes")}</Label>
            <Textarea
              id="payout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {t("createRun")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
