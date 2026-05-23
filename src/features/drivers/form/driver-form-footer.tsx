"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DriverFormFooter({
  savedAtLabel,
  saveLabel,
  cancelLabel,
  disabled,
  pending,
  onCancel,
  onSave,
}: {
  savedAtLabel?: string;
  saveLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-h-4 text-xs text-muted-foreground">{savedAtLabel ?? null}</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 cursor-pointer rounded-md"
            disabled={pending}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 cursor-pointer rounded-md px-4"
            disabled={disabled || pending}
            onClick={onSave}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
