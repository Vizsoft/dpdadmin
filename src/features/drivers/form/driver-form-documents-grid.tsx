"use client";

import { DriverDocumentUpload } from "../driver-document-upload";
import type { DriverDocumentType, DriverRemoteDocument } from "../types";
import { SectionLabel } from "./driver-form-primitives";

export function DriverFormDocumentsGrid({
  isEdit,
  disabled,
  intakeId,
  driverProfileId,
  documents,
  errors,
  remoteDocuments,
  onInlineChange,
  onRemoteChange,
  sectionLabel,
}: {
  isEdit: boolean;
  disabled?: boolean;
  intakeId: string;
  driverProfileId: string | null;
  documents: Record<DriverDocumentType, File | null>;
  errors: Partial<Record<DriverDocumentType, string>>;
  remoteDocuments: Partial<Record<DriverDocumentType, DriverRemoteDocument>>;
  onInlineChange: (docType: DriverDocumentType, file: File | null) => void;
  onRemoteChange: (docType: DriverDocumentType, doc: DriverRemoteDocument | null) => void;
  sectionLabel: string;
}) {
  const docTypes: DriverDocumentType[] = ["license", "civil_id", "work_permit", "passport"];

  return (
    <section
      id="driver-section-documents"
      data-driver-section-id="documents"
      className="space-y-3 rounded-xl border border-border bg-card/70 p-5"
    >
      <SectionLabel>{sectionLabel}</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2">
        {docTypes.map((docType) =>
          isEdit ? (
            <DriverDocumentUpload
              key={docType}
              mode="remote"
              variant="card"
              docType={docType}
              intakeId={intakeId}
              driverProfileId={driverProfileId}
              existing={remoteDocuments[docType] ?? null}
              disabled={disabled}
              onChanged={(next) => onRemoteChange(docType, next)}
            />
          ) : (
            <DriverDocumentUpload
              key={docType}
              mode="inline"
              variant="card"
              docType={docType}
              file={documents[docType]}
              error={errors[docType]}
              disabled={disabled}
              onChange={(file) => onInlineChange(docType, file)}
            />
          ),
        )}
      </div>
    </section>
  );
}

