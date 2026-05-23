"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SearchableSelectItem = {
  value: string;
  label: string;
};

export function SearchableSelect({
  value,
  onValueChange,
  items,
  placeholder,
  searchPlaceholder = "Search...",
  disabled,
  invalid,
}: {
  value: string;
  onValueChange: (next: string) => void;
  items: SearchableSelectItem[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(
    () => items.find((item) => item.value === value)?.label,
    [items, value],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => item.label.toLowerCase().includes(term));
  }, [items, query]);

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input bg-background px-3 text-sm shadow-xs transition-colors",
          selectedLabel ? "text-foreground" : "text-muted-foreground",
          invalid && "border-destructive/70",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="truncate text-left">{selectedLabel ?? placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] min-w-[280px] p-2" align="start">
        <div className="mb-2 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 rounded-md"
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="max-h-[260px] space-y-1 overflow-y-auto">
          {filtered.map((item) => {
            const checked = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/70",
                  checked && "bg-muted",
                )}
                onClick={() => onValueChange(item.value)}
              >
                <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                {checked ? <Check className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
          {filtered.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No matches found.</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

