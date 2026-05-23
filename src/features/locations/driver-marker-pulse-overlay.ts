import type {
  GoogleMapInstance,
  GoogleMapProjection,
  GoogleMapsApi,
  GoogleOverlayViewClass,
} from "@/lib/google-maps/load";
import type { PinStatus } from "./types";

const PULSE_COLORS: Record<PinStatus, string> = {
  active: "rgba(16, 185, 129, 0.45)",
  idle: "rgba(245, 158, 11, 0.4)",
  alert: "rgba(239, 68, 68, 0.42)",
};

type PulseOverlay = {
  setMap: (map: GoogleMapInstance | null) => void;
  setPosition: (lat: number, lng: number) => void;
};

export function createDriverPulseOverlay(
  google: GoogleMapsApi,
  map: GoogleMapInstance,
  position: { lat: number; lng: number },
  pinStatus: PinStatus,
): PulseOverlay {
  const OverlayCtor = google.maps.OverlayView as GoogleOverlayViewClass;
  const overlay = new OverlayCtor();
  let node: HTMLDivElement | null = null;
  let latest = position;

  (overlay as unknown as { onAdd: () => void }).onAdd = () => {
    const panes = overlay.getPanes();
    if (!panes?.overlayMouseTarget) return;
    node = document.createElement("div");
    node.style.position = "absolute";
    node.style.width = "30px";
    node.style.height = "30px";
    node.style.borderRadius = "9999px";
    node.style.background = PULSE_COLORS[pinStatus];
    node.style.boxShadow = `0 0 0 0 ${PULSE_COLORS[pinStatus]}`;
    node.style.transform = "translate(-15px, -15px)";
    node.style.animation = "dpd-driver-pulse 1.8s ease-out infinite";
    node.style.pointerEvents = "none";
    panes.overlayMouseTarget.appendChild(node);
  };

  (overlay as unknown as { draw: () => void }).draw = () => {
    if (!node) return;
    const projection = overlay.getProjection() as GoogleMapProjection | null;
    if (!projection) return;
    const pixel = projection.fromLatLngToDivPixel(latest);
    if (!pixel) return;
    node.style.left = `${pixel.x}px`;
    node.style.top = `${pixel.y}px`;
  };

  (overlay as unknown as { onRemove: () => void }).onRemove = () => {
    if (node?.parentNode) node.parentNode.removeChild(node);
    node = null;
  };

  if (typeof document !== "undefined" && !document.getElementById("dpd-driver-pulse-keyframes")) {
    const style = document.createElement("style");
    style.id = "dpd-driver-pulse-keyframes";
    style.textContent = `
      @keyframes dpd-driver-pulse {
        0% { transform: translate(-15px, -15px) scale(0.6); opacity: 0.7; }
        70% { transform: translate(-15px, -15px) scale(1.7); opacity: 0; }
        100% { transform: translate(-15px, -15px) scale(1.7); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  overlay.setMap(map);

  return {
    setMap: (nextMap) => overlay.setMap(nextMap),
    setPosition: (lat, lng) => {
      latest = { lat, lng };
      (overlay as unknown as { draw: () => void }).draw();
    },
  };
}
