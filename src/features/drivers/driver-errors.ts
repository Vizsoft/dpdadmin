export const DRIVER_ERROR_KEYS = [
  "not_authorized",
  "missing_fields",
  "invalid_driver_code",
  "invalid_phone",
  "invalid_civil_id",
  "phone_exists",
  "driver_code_exists",
  "missing_documents",
  "invalid_document_type",
  "file_too_large",
  "invalid_file_type",
  "upload_failed",
  "r2_not_configured",
  "save_failed",
] as const;

export type DriverErrorKey = (typeof DRIVER_ERROR_KEYS)[number];

export function isDriverErrorKey(value: string | undefined): value is DriverErrorKey {
  return DRIVER_ERROR_KEYS.includes(value as DriverErrorKey);
}

export function mapDriverDbError(error: { code?: string }): DriverErrorKey {
  if (error.code === "23505") return "phone_exists";
  return "save_failed";
}
