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

export type GoogleMapsLoadFailure =
  | "missing_key"
  | "auth_failure"
  | "load_error";

declare global {
  interface Window {
    google?: GoogleMapsApi;
    gm_authFailure?: () => void;
    __dpdGoogleMapsInit?: () => void;
  }
}

let loadPromise: Promise<GoogleMapsApi | null> | null = null;
let lastFailure: GoogleMapsLoadFailure | null = null;
let pendingResolve: ((api: GoogleMapsApi | null) => void) | null = null;

export function getGoogleMapsLoadFailure(): GoogleMapsLoadFailure | null {
  return lastFailure;
}

function installAuthFailureHandler() {
  if (typeof window === "undefined") return;
  window.gm_authFailure = () => {
    lastFailure = "auth_failure";
    loadPromise = null;
    pendingResolve?.(null);
    pendingResolve = null;
  };
}

/** Lazy-load Google Maps JS API with Places library. Returns null when key is unset or blocked. */
export function loadGoogleMaps(): Promise<GoogleMapsApi | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    lastFailure = "missing_key";
    return Promise.resolve(null);
  }

  if (lastFailure === "auth_failure") {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.Map && window.google.maps.places) {
    lastFailure = null;
    return Promise.resolve(window.google);
  }

  if (!loadPromise) {
    installAuthFailureHandler();

    loadPromise = new Promise((resolve) => {
      pendingResolve = resolve;
      const finish = (api: GoogleMapsApi | null) => {
        pendingResolve = null;
        if (!api?.maps?.Map) {
          if (lastFailure !== "auth_failure") {
            lastFailure = lastFailure ?? "load_error";
          }
          resolve(null);
          return;
        }
        lastFailure = null;
        resolve(api);
      };

      const callbackName = "__dpdGoogleMapsInit";
      window[callbackName] = () => {
        delete window[callbackName];
        finish(window.google ?? null);
      };

      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps="true"]',
      );
      if (existing) {
        if (window.google?.maps?.Map) {
          finish(window.google);
          return;
        }
        existing.addEventListener("load", () => finish(window.google ?? null));
        existing.addEventListener("error", () => {
          lastFailure = "load_error";
          finish(null);
        });
        return;
      }

      const script = document.createElement("script");
      script.dataset.googleMaps = "true";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${callbackName}&loading=async`;
      script.onerror = () => {
        lastFailure = "load_error";
        finish(null);
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}
