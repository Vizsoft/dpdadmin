import {
  RESTAURANT_STATUSES,
  type RestaurantStatus,
  isActiveFromRestaurantStatus,
} from "./restaurant-status";

export function parseRestaurantFormData(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const externalMerchantId = String(formData.get("externalMerchantId") ?? "").trim();
  const mapLink = String(formData.get("mapLink") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "draft").trim();

  const status = RESTAURANT_STATUSES.includes(statusRaw as RestaurantStatus)
    ? (statusRaw as RestaurantStatus)
    : "draft";

  return {
    id,
    partnerId,
    zoneId,
    name,
    externalMerchantId,
    mapLink,
    status,
    isActive: isActiveFromRestaurantStatus(status),
  };
}
