"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function AppModalFooter({
  title,
  subtitle,
  closeLabel = "Close",
  onClose,
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  closeLabel?: string;
  onClose: () => void;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-5 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0 cursor-pointer rounded-md px-2.5"
            onClick={onClose}
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ms-1.5 sm:inline">{closeLabel}</span>
          </Button>
          <div className="min-w-0 pt-0.5">
            <DialogTitle className="truncate text-sm font-semibold leading-tight text-foreground">
              {title}
            </DialogTitle>
            {subtitle ? (
              <DialogDescription className="mt-0.5 line-clamp-1 text-[11px] leading-snug">
                {subtitle}
              </DialogDescription>
            ) : null}
            {meta ? <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
