"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DriverAvatarUpload } from "../driver-avatar-upload";
import { CIVIL_ID_DIGIT_COUNT, restrictDigits } from "../driver-phone";
import { DriverPhoneField } from "./driver-phone-field";
import {
  FieldBlock,
  FieldError,
  FieldLabel,
  MetadataBadge,
  SectionHeading,
} from "./driver-form-primitives";

export function DriverFormIdentitySection({
  fullName,
  onFullNameChange,
  phone,
  onPhoneChange,
  civilId,
  onCivilIdChange,
  employeeId,
  onEmployeeIdChange,
  showEmployeeId,
  driverCode,
  driverCodeHint,
  labels,
  placeholders,
  uploadLabel,
  removeLabel,
  avatarPreview,
  onAvatarSelect,
  onAvatarRemove,
  disabled,
  errors,
}: {
  fullName: string;
  onFullNameChange: (next: string) => void;
  phone: string;
  onPhoneChange: (next: string) => void;
  civilId: string;
  onCivilIdChange: (next: string) => void;
  employeeId: string;
  onEmployeeIdChange: (next: string) => void;
  showEmployeeId: boolean;
  driverCode: string;
  driverCodeHint: string;
  labels: {
    section: string;
    fullName: string;
    phone: string;
    civilId: string;
    employeeId: string;
    driverCode: string;
  };
  placeholders: {
    fullName: string;
    civilId: string;
  };
  uploadLabel: string;
  removeLabel: string;
  avatarPreview: string | null;
  onAvatarSelect: (file: File | null) => void;
  onAvatarRemove: () => void;
  disabled?: boolean;
  errors: {
    fullName?: string;
    phone?: string;
    civilId?: string;
  };
}) {
  return (
    <section className="space-y-2.5 rounded-lg border border-border bg-card p-4">
      <SectionHeading icon={User} accent="primary">
        {labels.section}
      </SectionHeading>
      <div
        className={cn(
          "grid items-end gap-2.5",
          showEmployeeId
            ? "grid-cols-[48px_minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]"
            : "grid-cols-[48px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)]",
        )}
      >
        <DriverAvatarUpload
          variant="badge"
          fullName={fullName}
          previewUrl={avatarPreview}
          uploadLabel={uploadLabel}
          removeLabel={removeLabel}
          hint=""
          onFileSelect={onAvatarSelect}
          onRemove={onAvatarRemove}
          disabled={disabled}
        />

        <FieldBlock>
          <FieldLabel htmlFor="driver-full-name" required>
            {labels.fullName}
          </FieldLabel>
          <Input
            id="driver-full-name"
            value={fullName}
            disabled={disabled}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="h-9 rounded-md text-sm"
            placeholder={placeholders.fullName}
            aria-invalid={Boolean(errors.fullName)}
          />
          <FieldError message={errors.fullName} />
        </FieldBlock>

        <FieldBlock>
          <FieldLabel htmlFor="driver-phone" required>
            {labels.phone}
          </FieldLabel>
          <DriverPhoneField
            id="driver-phone"
            value={phone}
            disabled={disabled}
            ariaInvalid={Boolean(errors.phone)}
            onChange={onPhoneChange}
          />
          <FieldError message={errors.phone} />
        </FieldBlock>

        <FieldBlock>
          <FieldLabel htmlFor="driver-civil-id" required>
            {labels.civilId}
          </FieldLabel>
          <Input
            id="driver-civil-id"
            type="text"
            inputMode="numeric"
            maxLength={CIVIL_ID_DIGIT_COUNT}
            value={civilId}
            disabled={disabled}
            onChange={(event) =>
              onCivilIdChange(restrictDigits(event.target.value, CIVIL_ID_DIGIT_COUNT))
            }
            className="h-9 rounded-md font-mono text-sm tabular-nums"
            placeholder={placeholders.civilId}
            aria-invalid={Boolean(errors.civilId)}
          />
          <FieldError message={errors.civilId} />
        </FieldBlock>

        {showEmployeeId ? (
          <FieldBlock>
            <FieldLabel htmlFor="driver-employee-id">{labels.employeeId}</FieldLabel>
            <Input
              id="driver-employee-id"
              value={employeeId}
              disabled={disabled}
              onChange={(event) => onEmployeeIdChange(event.target.value)}
              className="h-9 rounded-md font-mono text-sm tabular-nums"
            />
          </FieldBlock>
        ) : null}

        <FieldBlock>
          <FieldLabel>{labels.driverCode}</FieldLabel>
          <MetadataBadge code={driverCode} label={driverCodeHint} />
        </FieldBlock>
      </div>
    </section>
  );
}
