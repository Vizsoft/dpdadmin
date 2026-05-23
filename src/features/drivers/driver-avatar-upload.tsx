"use client";

import { useRef } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function DriverAvatarUpload({
  fullName,
  previewUrl,
  disabled,
  uploadLabel,
  removeLabel,
  hint,
  onFileSelect,
  onRemove,
  size = "lg",
}: {
  fullName: string;
  previewUrl: string | null;
  disabled?: boolean;
  uploadLabel: string;
  removeLabel: string;
  hint: string;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  size?: "sm" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const compact = size === "sm";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-border bg-muted/20",
        compact ? "gap-2 p-2.5" : "gap-3 p-4",
      )}
    >
      <Avatar className={cn(compact ? "h-14 w-14" : "h-24 w-24")} size={compact ? "default" : "lg"}>
        {previewUrl ? <AvatarImage src={previewUrl} alt="" /> : null}
        <AvatarFallback className={cn("font-semibold", compact ? "text-xs" : "text-lg")}>
          {fullName.trim() ? initialsFromName(fullName) : <User className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />}
        </AvatarFallback>
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        disabled={disabled}
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />
      <div className={cn("flex w-full", compact ? "flex-row gap-1.5" : "flex-col gap-2")}>
        <Button
          type="button"
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon-sm" : "default"}
          className={cn("cursor-pointer rounded-lg", compact ? "h-7 w-7" : "w-full")}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label={uploadLabel}
        >
          <Camera className={cn(compact ? "h-3.5 w-3.5" : "me-2 h-4 w-4")} />
          {compact ? null : uploadLabel}
        </Button>
        {previewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size={compact ? "icon-sm" : "default"}
            className={cn("cursor-pointer rounded-lg", compact ? "h-7 w-7" : "w-full")}
            disabled={disabled}
            onClick={onRemove}
            aria-label={removeLabel}
          >
            {compact ? "×" : removeLabel}
          </Button>
        ) : null}
      </div>
      <p className={cn("text-center text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
        {hint}
      </p>
    </div>
  );
}
