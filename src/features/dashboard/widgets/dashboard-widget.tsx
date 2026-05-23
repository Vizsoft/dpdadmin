"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoDataBadge } from "../demo-data-badge";
import { cn } from "@/lib/utils";

export function DashboardWidget({
  title,
  href,
  demo,
  demoTooltipKey,
  children,
  className,
  contentClassName,
}: {
  title: string;
  href?: string;
  demo?: boolean;
  demoTooltipKey?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("flex min-h-[280px] flex-col overflow-hidden rounded-xl border-border shadow-sm", className)}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {demo ? <DemoDataBadge tooltipKey={demoTooltipKey} /> : null}
          {href ? (
            <Link
              href={href}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
              <span className="sr-only">{title}</span>
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("min-h-0 flex-1 overflow-auto p-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
