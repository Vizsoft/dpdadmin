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
