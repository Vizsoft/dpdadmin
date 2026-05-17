"use client";

import { cn } from "@/lib/utils";

export type TabItem = {
  id: string;
  label: string;
};

export function TabBar({
  items,
  activeId,
  className,
}: {
  items: TabItem[];
  activeId: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-6 border-b border-border", className)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              "cursor-pointer border-b-2 pb-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
