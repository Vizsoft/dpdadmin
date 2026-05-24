"use client";

import { Pencil, Trash2, Move, PenLine, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export type ZoneMapTool = "draw" | "edit" | "move" | "delete" | "clear";

const TOOL_ICON = {
  draw: PenLine,
  edit: Pencil,
  move: Move,
  delete: Trash2,
  clear: Eraser,
} as const;

export function ZoneFormMapToolbar({
  activeTool,
  onToolChange,
  labels,
}: {
  activeTool: ZoneMapTool;
  onToolChange: (tool: ZoneMapTool) => void;
  labels: Record<ZoneMapTool, string>;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border/70 bg-background/95 p-1 shadow-sm backdrop-blur">
      {(Object.keys(TOOL_ICON) as ZoneMapTool[]).map((tool) => {
        const Icon = TOOL_ICON[tool];
        const active = activeTool === tool;
        return (
          <button
            key={tool}
            type="button"
            onClick={() => onToolChange(tool)}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {labels[tool]}
          </button>
        );
      })}
    </div>
  );
}

