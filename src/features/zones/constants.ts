/** Default map center: Kuwait City area */
export const KUWAIT_MAP_CENTER: [number, number] = [29.37, 47.97];
export const DEFAULT_MAP_ZOOM = 12;

export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const DEFAULT_MAPTILER_MAP_ID = "streets-v2";

export const ZONE_FILL_COLOR = "#EF5B4D";
export const ZONE_STROKE_COLOR = "#EF5B4D";

export type ZoneMapTileProps = {
  url: string;
  attribution: string;
  provider: "maptiler" | "osm";
};

/** MapTiler raster tiles when API key is set; otherwise OpenStreetMap. */
export function getZoneMapTileProps(): ZoneMapTileProps {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim();
  const mapId =
    process.env.NEXT_PUBLIC_MAPTILER_MAP_ID?.trim() || DEFAULT_MAPTILER_MAP_ID;

  if (key) {
    return {
      url: `https://api.maptiler.com/maps/${mapId}/{z}/{x}/{y}.png?key=${key}`,
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      provider: "maptiler",
    };
  }

  return {
    url: OSM_TILE_URL,
    attribution: OSM_ATTRIBUTION,
    provider: "osm",
  };
}
