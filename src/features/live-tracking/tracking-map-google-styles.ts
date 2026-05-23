import type { GoogleMapStyleRule } from "@/lib/google-maps/load";

export function buildTrackingMapStyles(hideLabels: boolean): GoogleMapStyleRule[] {
  const base: GoogleMapStyleRule[] = [
    { elementType: "geometry", stylers: [{ color: "#f5f6f8" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f8fafc" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#d1d5db" }],
    },
    {
      featureType: "landscape.man_made",
      elementType: "geometry.fill",
      stylers: [{ color: "#eef2f7" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#e5e7eb" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#e5e7eb" }],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#f3f4f6" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#e2e8f0" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#dbeafe" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c7e8ff" }],
    },
  ];

  if (!hideLabels) return base;

  return [
    ...base,
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
    {
      featureType: "administrative",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  ];
}
