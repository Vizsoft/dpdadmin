export type TrackingStatus = "idle" | "moving" | "delivery_submit";

export type ZoneStatus = "in_zone" | "out_of_zone" | "unknown";

export type PinStatus = "active" | "idle" | "alert";

export type DriverLiveLocation = {
  driverId: string;
  driverName: string;
  driverCode: string;
  employeeId: string | null;
  isOnDuty: boolean;
  restaurantName: string | null;
  latitude: number;
  longitude: number;
  speedMps: number | null;
  distanceTodayMeters: number;
  accuracyMeters: number | null;
  batteryPct: number | null;
  heading: number | null;
  trackingStatus: TrackingStatus;
  zoneStatus: ZoneStatus | null;
  lastSeenAt: string;
  updatedAt: string;
  pinStatus: PinStatus;
};

export type DriverLocationEvent = {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speedMps: number | null;
  accuracyMeters: number | null;
  batteryPct: number | null;
  headingDeg?: number | null;
  altitudeM?: number | null;
  networkType?: string | null;
  chargingState?: string | null;
  isMocked?: boolean | null;
  locationProvider?: string | null;
  activeDeliveryId?: string | null;
  trackingStatus: TrackingStatus;
  zoneStatus: ZoneStatus | null;
  deliveryId: string | null;
  recordedAt: string;
};

export type RestaurantMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
};

export type DriverLocationMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  pinStatus?: PinStatus;
  trackingStatus?: TrackingStatus;
  vehicleType?: "bike" | "car";
  heading?: number | null;
  highlight?: boolean;
};

export type DriverLocationMapPath = {
  lat: number;
  lng: number;
}[];
