import type { DriverLiveLocation } from "@/features/locations/types";

export type LiveDriverMeta = {
  zoneId: string | null;
  partnerId: string | null;
  zoneName: string | null;
  partnerName: string | null;
  intakeId: string | null;
  phone: string | null;
  detailHref: string | null;
};

export type LiveTrackingEnrichedDriver = DriverLiveLocation & {
  meta?: LiveDriverMeta;
};

export type LiveRecentDelivery = {
  id: string;
  driverId: string;
  shortId: string;
  status: "pending" | "verified" | "rejected" | "under_review";
  partnerName: string;
  deliveredAt: string;
};
