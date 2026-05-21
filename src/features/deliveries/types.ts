export const DELIVERY_STATUSES = ["pending", "verified", "rejected"] as const;
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
  rejection_reason: string | null;
  delivered_at: string;
  created_at: string;
};

export type DeliveryDetailModel = {
  id: string;
  short_id: string;
  status: DeliveryStatus;
  external_order_id: string | null;
  order_proof_url: string | null;
  rejection_reason: string | null;
  delivered_at: string;
  created_at: string;
  driver_id: string;
  driver_name: string;
  driver_code: string;
  driver_phone: string;
  partner_name: string;
  partner_logo_url: string | null;
  zone_name: string;
};
