"use client";

import { Loader2 } from "lucide-react";
import { AppModalFooter } from "@/components/app/app-modal-footer";
import { Button } from "@/components/ui/button";

export function DriverFormFooter({
  title,
  subtitle,
  closeLabel,
  savedAtLabel,
  saveLabel,
  cancelLabel,
  disabled,
  pending,
  onClose,
  onCancel,
  onSave,
}: {
  title: string;
  subtitle: string;
  closeLabel: string;
  savedAtLabel?: string;
  saveLabel: string;
  cancelLabel: string;
  disabled?: boolean;
  pending?: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <AppModalFooter
      title={title}
      subtitle={subtitle}
      closeLabel={closeLabel}
      onClose={onClose}
      meta={savedAtLabel}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 cursor-pointer rounded-md"
        disabled={pending}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        className="h-9 cursor-pointer rounded-md px-4"
        disabled={disabled || pending}
        onClick={onSave}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saveLabel}
      </Button>
    </AppModalFooter>
  );
}
