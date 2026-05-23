"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

export function FieldBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  );
}

export function MetadataBadge({
  code,
  label,
}: {
  code: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
      <p className="text-sm font-semibold tracking-tight text-primary">{code}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

