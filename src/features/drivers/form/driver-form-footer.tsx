"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DriverFormFooter({
  completionPercent,
  savedAtLabel,
  saveLabel,
  cancelLabel,
  disabled,
  pending,
  onCancel,
  onSave,
}: {
  completionPercent: number;
  savedAtLabel?: string;
  saveLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background/95 px-8 py-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {savedAtLabel ?? `Driver profile ${completionPercent}% complete`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 cursor-pointer rounded-lg"
            disabled={pending}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="h-10 cursor-pointer rounded-lg px-5"
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

