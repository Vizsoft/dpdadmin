/** Minimal surface used by restaurant place search (avoids @types/google.maps dependency). */
export type GoogleMapsPlacesApi = {
  maps: {
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

declare global {
  interface Window {
    google?: GoogleMapsPlacesApi;
  }
}

let loadPromise: Promise<GoogleMapsPlacesApi | null> | null = null;

/** Lazy-load Google Maps JS API with Places library. Returns null when key is unset. */
export function loadGoogleMaps(): Promise<GoogleMapsPlacesApi | null> {
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
