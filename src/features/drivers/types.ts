export const DOCUMENT_TYPES = [
  "license",
  "civil_id",
  "work_permit",
  "passport",
] as const;

export type DriverDocumentType = (typeof DOCUMENT_TYPES)[number];

export const ASSET_TYPES = [
  "gps",
  "sim",
  "phone",
  "delivery_bag",
  "helmet",
  "uniform",
] as const;

export type DriverAssetType = (typeof ASSET_TYPES)[number];

/** @deprecated Legacy intake status — use workflow_status + linked */
export type DriverIntakeStatus = "awaiting_app_link" | "linked" | "cancelled";

export const DRIVER_WORKFLOW_STATUSES = ["draft", "pending", "approved"] as const;
export type DriverWorkflowStatus = (typeof DRIVER_WORKFLOW_STATUSES)[number];

export const DRIVER_ACCOUNT_STATUSES = ["active", "suspended", "pending"] as const;
export type DriverAccountStatus = (typeof DRIVER_ACCOUNT_STATUSES)[number];

export type DriverIntakeRow = {
  id: string;
  phone: string;
  full_name: string;
  civil_id: string;
  driver_code: string;
  partner_id: string;
  zone_id: string;
  vehicle_id: string | null;
  assets_issued: Record<string, boolean>;
  status: DriverIntakeStatus;
  workflow_status: DriverWorkflowStatus;
  linked: boolean;
  linked_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleOption = {
  id: string;
  bike_id: string;
  reg_number: string | null;
};

export type PartnerOption = {
  id: string;
  name: string;
  logo_url: string | null;
};

export type ZoneOption = {
  id: string;
  name: string;
  code: string;
};

export type RestaurantOption = {
  id: string;
  name: string;
  partner_id: string;
  status: "draft" | "published" | "archived";
};

export type PendingDocumentFile = {
  docType: DriverDocumentType;
  file: File;
  previewName: string;
};

export type DriverListRow = {
  id: string;
  driver_code: string;
  full_name: string;
  phone: string;
  partner_id: string;
  partner_name: string;
  partner_logo_url: string | null;
  zone_id: string;
  zone_name: string;
  workflow_status: DriverWorkflowStatus;
  linked: boolean;
  account_status: DriverAccountStatus;
  is_on_duty: boolean;
  today_deliveries: number;
  app_passcode: string | null;
  archived_at: string | null;
};

export type DriverDetailModel = {
  id: string;
  /** Intake row id for edit/update; null when no intake record exists */
  intake_id: string | null;
  source: "intake" | "driver";
  driver_code: string;
  full_name: string;
  phone: string;
  email: string | null;
  civil_id: string;
  avatar_url: string | null;
  partner_name: string;
  zone_label: string;
  vehicle_label: string | null;
  partner_id: string;
  zone_id: string;
  vehicle_id: string | null;
  workflow_status: DriverWorkflowStatus;
  linked: boolean;
  linked_profile_id: string | null;
  base_earnings_kwd: number | null;
  joined_at: string | null;
  assets_issued: Record<string, boolean>;
  restaurant_ids: string[];
  restaurant_names: string[];
  app_passcode: string | null;
  account_status: DriverAccountStatus;
  archived_at: string | null;
};
