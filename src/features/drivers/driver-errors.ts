export const DRIVER_ERROR_KEYS = [
  "not_authorized",
  "missing_fields",
  "invalid_driver_code",
  "invalid_phone",
  "invalid_civil_id",
  "phone_exists",
  "employee_id_exists",
  "driver_code_exists",
  "missing_documents",
  "invalid_document_type",
  "file_too_large",
  "invalid_file_type",
  "upload_failed",
  "r2_not_configured",
  "invalid_restaurants",
  "save_failed",
] as const;

export type DriverErrorKey = (typeof DRIVER_ERROR_KEYS)[number];

export function isDriverErrorKey(value: string | undefined): value is DriverErrorKey {
  return DRIVER_ERROR_KEYS.includes(value as DriverErrorKey);
}

export function mapDriverDbError(
  error: { code?: string; message?: string },
  context?: "employee_id",
): DriverErrorKey {
  if (error.code === "23505") {
    if (context === "employee_id") return "employee_id_exists";
    const msg = error.message ?? "";
    if (msg.includes("employee_id")) return "employee_id_exists";
    return "phone_exists";
  }
  return "save_failed";
}

export function normalizeEmployeeId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
