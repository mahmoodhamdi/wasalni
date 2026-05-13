/**
 * Bagour, Egypt — the launch city. Used as the default map centre when
 * geolocation hasn't resolved yet.
 */
export const DEFAULT_CENTER = {
  longitude: 31.0438,
  latitude: 30.7639,
} as const;

export const DEFAULT_ZOOM = 13;

/**
 * Tile style URL. OpenFreeMap is a free, MIT-licensed OSM tile server
 * with global coverage. No API key needed. Falls back to OSM raster if
 * the vector style is unreachable.
 */
export const TILE_STYLE_URL = 'https://tiles.openfreemap.org/styles/bright';

/** Min/max zoom levels we allow the user to pan to. */
export const ZOOM_MIN = 3;
export const ZOOM_MAX = 19;
