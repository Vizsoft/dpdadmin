"use client";

import { useRef } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
}: {
  fullName: string;
  previewUrl: string | null;
  disabled?: boolean;
  uploadLabel: string;
  removeLabel: string;
  hint: string;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/20 p-4">
      <Avatar className="h-24 w-24" size="lg">
        {previewUrl ? <AvatarImage src={previewUrl} alt="" /> : null}
        <AvatarFallback className="text-lg font-semibold">
          {fullName.trim() ? initialsFromName(fullName) : <User className="h-5 w-5" />}
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
      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer rounded-lg"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="me-2 h-4 w-4" />
          {uploadLabel}
        </Button>
        {previewUrl ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full cursor-pointer rounded-lg"
            disabled={disabled}
            onClick={onRemove}
          >
            {removeLabel}
          </Button>
        ) : null}
      </div>
      <p className="text-center text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
