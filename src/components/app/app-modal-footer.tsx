"use client";

import type { ReactNode } from "react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function AppModalFooter({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
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
        <div className="flex shrink-0 items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
