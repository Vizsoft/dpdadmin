"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SimpleConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
};

/** Single-step confirm for non–top-level actions (e.g. custom themes). */
export function SimpleConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  isPending: externalPending,
}: SimpleConfirmDialogProps) {
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const busy = isPending || externalPending;

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md gap-0" showCloseButton={!busy}>
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-1 text-start">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer rounded-lg"
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              (confirmLabel ?? t("confirmDelete.confirmButton"))
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
