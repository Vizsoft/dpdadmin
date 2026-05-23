"use client";

import { Input } from "@/components/ui/input";
import { KUWAIT_PHONE_DIGIT_COUNT, restrictDigits } from "../driver-phone";

export function DriverPhoneField({
  id,
  value,
  disabled,
  ariaInvalid,
  onChange,
}: {
  id: string;
  value: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex h-11 items-center rounded-xl border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-primary/30">
      <div className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-muted/40 px-2 text-sm text-muted-foreground">
        <span aria-hidden="true">🇰🇼</span>
        <span className="font-medium">+965</span>
      </div>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={KUWAIT_PHONE_DIGIT_COUNT}
        value={value}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        onChange={(event) => onChange(restrictDigits(event.target.value, KUWAIT_PHONE_DIGIT_COUNT))}
        className="h-full border-0 bg-transparent font-mono tabular-nums shadow-none ring-0 focus-visible:ring-0"
      />
    </div>
  );
}

