"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isDriverErrorKey } from "./driver-errors";
import { validateDocumentFile } from "./driver-form-validation";
import type { DriverDocumentType } from "./types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

type DriverDocumentUploadProps = {
  docType: DriverDocumentType;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  isSubmitting?: boolean;
};

export function DriverDocumentUpload({
  docType,
  file,
  onChange,
  error,
  isSubmitting = false,
}: DriverDocumentUploadProps) {
  const t = useTranslations("pages.driverNew");
  const inputRef = useRef<HTMLInputElement>(null);
  const [localErrorKey, setLocalErrorKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const label = t(`documents.${docType}`);

  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayError =
    error ??
    (localErrorKey && isDriverErrorKey(localErrorKey)
      ? t(`errors.${localErrorKey}`)
      : localErrorKey
        ? localErrorKey
        : undefined);

  const removeFile = () => {
    onChange(null);
    setLocalErrorKey(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePick = (picked: File | null) => {
    if (!picked) return;
    const validationError = validateDocumentFile(picked);
    if (validationError) {
      setLocalErrorKey(validationError);
      return;
    }
    setLocalErrorKey(null);
    onChange(picked);
  };

  const borderClass = displayError
    ? "border-destructive/60 bg-destructive/5"
    : file
      ? "border-primary/30 bg-primary/5"
      : "border-border bg-muted/20";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isSubmitting}
          className={cn(
            "flex min-h-[7.5rem] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50",
            borderClass,
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("uploadDocument")}</span>
          <span className="text-[11px] text-muted-foreground">{t("uploadFormats")}</span>
        </button>
      ) : (
        <div
          className={cn(
            "rounded-lg border p-3 transition-colors",
            borderClass,
            !isSubmitting && "cursor-pointer hover:bg-muted/30",
          )}
          onClick={() => {
            if (!isSubmitting) inputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSubmitting) inputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          aria-label={t("replaceDocument")}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : isImageFile(file) ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              <div className="mt-2 flex items-center gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs text-primary">{t("documentUploading")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-xs text-primary">{t("documentSelected")}</span>
                  </>
                )}
              </div>
              {!isSubmitting ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {t("documentPendingHint")}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 cursor-pointer text-destructive hover:text-destructive"
              disabled={isSubmitting}
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              aria-label={t("removeDocument")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={isSubmitting}
        onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
      />

      {displayError ? (
        <p className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
