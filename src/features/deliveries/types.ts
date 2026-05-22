export const DELIVERY_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "under_review",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export type DeliveryListRow = {
  id: string;
  short_id: string;
  driver_id: string;
  driver_name: string;
  driver_code: string;
  driver_phone: string;
  partner_id: string | null;
  partner_name: string;
  partner_logo_url: string | null;
  zone_id: string | null;
  zone_name: string;
  status: DeliveryStatus;
  external_order_id: string | null;
  order_proof_url: string | null;
  proof_display_url: string | null;
  proof_content_type: string | null;
  rejection_reason: string | null;
  delivered_at: string;
  delivered_lat: number | null;
  delivered_lng: number | null;
  created_at: string;
};

export type DeliveryDetailModel = {
  id: string;
  short_id: string;
  status: DeliveryStatus;
  external_order_id: string | null;
  order_proof_url: string | null;
  proof_display_url: string | null;
  proof_content_type: string | null;
  rejection_reason: string | null;
  delivered_at: string;
  delivered_lat: number | null;
  delivered_lng: number | null;
  created_at: string;
  driver_id: string;
  driver_name: string;
  driver_code: string;
  driver_phone: string;
  partner_name: string;
  partner_logo_url: string | null;
  zone_name: string;
};

export type DeliveryActionError =
  | "not_authorized"
  | "invalid_status"
  | "reason_required"
  | "update_failed"
  | "delete_failed";
