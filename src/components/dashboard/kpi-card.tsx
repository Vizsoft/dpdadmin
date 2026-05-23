import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiAccent = "default" | "success" | "warning" | "danger" | "primary";

const ACCENT_STYLES: Record<KpiAccent, { tile: string; icon: string }> = {
  default: {
    tile: "bg-muted text-muted-foreground",
    icon: "text-muted-foreground",
  },
  success: {
    tile: "bg-success-bg text-success",
    icon: "text-success",
  },
  warning: {
    tile: "bg-warning-bg text-warning",
    icon: "text-warning",
  },
  danger: {
    tile: "bg-danger-bg text-danger",
    icon: "text-danger",
  },
  primary: {
    tile: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: KpiAccent;
  className?: string;
}) {
  const accentStyles = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,15,15,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(15,15,15,0.06)]",
        className,
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
            accentStyles.tile,
          )}
        >
          <Icon className={cn("size-4", accentStyles.icon)} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
