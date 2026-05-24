import type { DriverDocumentType } from "@/features/drivers/types";

const ALLOWED_PREFIXES = ["drivers/", "partners/", "restaurants/"] as const;

export function isAllowedStorageKey(key: string): boolean {
  const normalized = key.trim().replace(/^\/+/, "");
  if (normalized.includes("..")) return false;
  return ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isR2ObjectKey(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return false;
  return (
    v.startsWith("drivers/") ||
    v.startsWith("driver-avatars/") ||
    v.startsWith("partners/") ||
    v.startsWith("restaurants/")
  );
}

export function buildRestaurantLogoKey(restaurantId: string, ext: string): string {
  return `restaurants/${restaurantId}/logo.${ext}`;
}

export function allRestaurantLogoKeys(restaurantId: string): string[] {
  return ["png", "jpg", "jpeg", "webp", "svg"].map((ext) =>
    buildRestaurantLogoKey(restaurantId, ext),
  );
}

export function extensionFromMime(mime: string): "pdf" | "png" | "webp" | "jpg" {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function buildIntakeDocumentKey(
  intakeId: string,
  docType: DriverDocumentType,
  ext: string,
): string {
  return `drivers/intakes/${intakeId}/${docType}.${ext}`;
}

export function buildDriverDocumentKey(
  driverId: string,
  docType: DriverDocumentType,
  ext: string,
): string {
  return `drivers/${driverId}/${docType}.${ext}`;
}

export function buildIntakeAvatarKey(intakeId: string, ext: string): string {
  return `drivers/intakes/${intakeId}/avatar.${ext}`;
}

export function buildDriverAvatarKey(driverId: string, ext: string): string {
  return `drivers/${driverId}/avatar.${ext}`;
}

export function buildPartnerLogoKey(partnerId: string, ext: string): string {
  return `partners/${partnerId}/logo.${ext}`;
}

/** All possible intake document keys for rollback (unknown ext per doc). */
export function allIntakeDocumentKeys(intakeId: string): string[] {
  const exts = ["pdf", "png", "jpg", "webp"] as const;
  const docTypes: DriverDocumentType[] = [
    "license",
    "civil_id",
    "work_permit",
    "passport",
  ];
  return docTypes.flatMap((docType) =>
    exts.map((ext) => buildIntakeDocumentKey(intakeId, docType, ext)),
  );
}

export function allPartnerLogoKeys(partnerId: string): string[] {
  return ["png", "jpg", "jpeg", "webp", "svg"].map((ext) =>
    buildPartnerLogoKey(partnerId, ext),
  );
}

export function allIntakeAvatarKeys(intakeId: string): string[] {
  return ["png", "jpg", "jpeg", "webp", "svg"].map((ext) =>
    buildIntakeAvatarKey(intakeId, ext),
  );
}

export function allDriverAvatarKeys(driverId: string): string[] {
  return ["png", "jpg", "jpeg", "webp", "svg"].map((ext) =>
    buildDriverAvatarKey(driverId, ext),
  );
}
