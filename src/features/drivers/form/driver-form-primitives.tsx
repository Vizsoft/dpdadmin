"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  required,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className={cn("text-xs font-medium", className)}>
      {children}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );
}

export function FieldBlock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-destructive" role="alert">
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
    <div className="flex h-9 flex-col justify-center rounded-md border border-border bg-muted/40 px-2.5">
      <p className="truncate font-mono text-xs font-semibold tabular-nums text-foreground">{code}</p>
      <p className="truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
