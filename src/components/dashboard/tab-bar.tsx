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
  onSelect,
}: {
  items: TabItem[];
  activeId: string;
  className?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className={cn("flex flex-wrap gap-6 border-b border-border", className)}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            className={cn(
              "cursor-pointer border-b-2 pb-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onSelect?.(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
