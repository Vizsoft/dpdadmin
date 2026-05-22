/** Minimal Google Maps JS API surface (avoids @types/google.maps dependency). */

export type GoogleMapLatLng = { lat: number; lng: number };

export type GoogleMapInstance = {
  setCenter: (center: GoogleMapLatLng) => void;
  setZoom: (zoom: number) => void;
  panTo: (center: GoogleMapLatLng) => void;
};

export type GoogleMarkerInstance = {
  setPosition: (position: GoogleMapLatLng) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null | undefined;
  addListener: (event: string, handler: () => void) => void;
};

export type GoogleMapsApi = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: {
        center: GoogleMapLatLng;
        zoom: number;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        fullscreenControl?: boolean;
        clickableIcons?: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (opts: {
      position: GoogleMapLatLng;
      map: GoogleMapInstance | null;
      draggable?: boolean;
    }) => GoogleMarkerInstance;
    event: {
      clearInstanceListeners: (instance: object) => void;
      addListener: (
        instance: GoogleMapInstance,
        event: string,
        handler: (e: { latLng: { lat: () => number; lng: () => number } | null }) => void,
      ) => void;
    };
    places: {
      AutocompleteService: new () => {
        getPlacePredictions: (
          request: {
            input: string;
            componentRestrictions?: { country: string | string[] };
          },
          callback: (
            predictions: Array<{ place_id: string; description: string }> | null,
            status: string,
          ) => void,
        ) => void;
      };
      PlacesService: new (attributionNode: HTMLElement) => {
        getDetails: (
          request: { placeId: string; fields: string[] },
          callback: (
            place: {
              geometry?: {
                location?: { lat: () => number; lng: () => number };
              };
            } | null,
            status: string,
          ) => void,
        ) => void;
      };
      PlacesServiceStatus: { OK: string };
    };
  };
};

/** @deprecated Use GoogleMapsApi */
export type GoogleMapsPlacesApi = GoogleMapsApi;

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let loadPromise: Promise<GoogleMapsApi | null> | null = null;

/** Lazy-load Google Maps JS API with Places library. Returns null when key is unset. */
export function loadGoogleMaps(): Promise<GoogleMapsApi | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps="true"]',
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google ?? null));
        existing.addEventListener("error", () => resolve(null));
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
      script.async = true;
      script.onload = () => resolve(window.google ?? null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
