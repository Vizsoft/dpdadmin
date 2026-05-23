"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DriverAvatarUpload } from "../driver-avatar-upload";
import { CIVIL_ID_DIGIT_COUNT, restrictDigits } from "../driver-phone";
import { DriverPhoneField } from "./driver-phone-field";
import { FieldBlock, FieldError, MetadataBadge, SectionLabel } from "./driver-form-primitives";

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
  avatarHint,
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
  avatarHint: string;
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
    <section
      id="driver-section-identity"
      data-driver-section-id="identity"
      className="space-y-3 rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
    >
      <SectionLabel>{labels.section}</SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[72px_1.4fr_1fr_1fr_auto] md:items-end">
        <DriverAvatarUpload
          variant="badge"
          fullName={fullName}
          previewUrl={avatarPreview}
          uploadLabel={uploadLabel}
          removeLabel={removeLabel}
          hint={avatarHint}
          onFileSelect={onAvatarSelect}
          onRemove={onAvatarRemove}
          disabled={disabled}
        />

        <FieldBlock>
          <Label htmlFor="driver-full-name">{labels.fullName} *</Label>
          <Input
            id="driver-full-name"
            value={fullName}
            disabled={disabled}
            onChange={(event) => onFullNameChange(event.target.value)}
            className="h-11 rounded-xl"
            placeholder={placeholders.fullName}
            aria-invalid={Boolean(errors.fullName)}
          />
          <FieldError message={errors.fullName} />
        </FieldBlock>

        <FieldBlock>
          <Label htmlFor="driver-phone">{labels.phone} *</Label>
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
          <Label htmlFor="driver-civil-id">{labels.civilId} *</Label>
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
            className="h-11 rounded-xl font-mono tabular-nums"
            placeholder={placeholders.civilId}
            aria-invalid={Boolean(errors.civilId)}
          />
          <FieldError message={errors.civilId} />
        </FieldBlock>

        <FieldBlock>
          <Label>{labels.driverCode}</Label>
          <MetadataBadge code={driverCode} label={driverCodeHint} />
        </FieldBlock>
      </div>

      {showEmployeeId ? (
        <div className="max-w-xs">
          <FieldBlock>
            <Label htmlFor="driver-employee-id">{labels.employeeId}</Label>
            <Input
              id="driver-employee-id"
              value={employeeId}
              disabled={disabled}
              onChange={(event) => onEmployeeIdChange(event.target.value)}
              className="h-11 rounded-xl font-mono tabular-nums"
            />
          </FieldBlock>
        </div>
      ) : null}
    </section>
  );
}

