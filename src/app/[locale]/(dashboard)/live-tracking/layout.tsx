import type { ReactNode } from "react";
import { LAYOUT } from "@/components/app/layout-spacing";
import { cn } from "@/lib/utils";

export default function LiveTrackingLayout({ children }: { children: ReactNode }) {
  return <div className={cn(LAYOUT.commandPageInsetNegate, "min-h-0")}>{children}</div>;
}
