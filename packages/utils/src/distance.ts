/**
 * Geo helpers — haversine distance, bearing, simple geofence check.
 * All coordinates are in WGS84 (latitude, longitude in degrees).
 */

export interface Coords {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6_371_000; // mean Earth radius in metres

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in metres between two coordinates. */
export function haversineMeters(a: Coords, b: Coords): number {
  const phi1 = toRad(a.latitude);
  const phi2 = toRad(b.latitude);
  const dPhi = toRad(b.latitude - a.latitude);
  const dLambda = toRad(b.longitude - a.longitude);

  const sinDPhi = Math.sin(dPhi / 2);
  const sinDLambda = Math.sin(dLambda / 2);
  const h = sinDPhi * sinDPhi + Math.cos(phi1) * Math.cos(phi2) * sinDLambda * sinDLambda;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Convenience: distance rounded to 2 decimal places, in kilometres. */
export function haversineKm(a: Coords, b: Coords): number {
  return Math.round((haversineMeters(a, b) / 1000) * 100) / 100;
}

/** Initial bearing (compass degrees, 0 = north) from a → b. */
export function bearingDegrees(a: Coords, b: Coords): number {
  const phi1 = toRad(a.latitude);
  const phi2 = toRad(b.latitude);
  const dLambda = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/** True iff `point` is within `radiusMeters` of `center`. */
export function withinRadius(point: Coords, center: Coords, radiusMeters: number): boolean {
  return haversineMeters(point, center) <= radiusMeters;
}

/** Human distance: 856 m → "856 m"; 12_350 m → "12.4 km". */
export function formatDistance(meters: number, locale: 'ar-EG' | 'en-EG' = 'ar-EG'): string {
  if (meters < 1000) {
    return `${Math.round(meters)} ${locale === 'ar-EG' ? 'م' : 'm'}`;
  }
  const km = Math.round(meters / 100) / 10;
  return `${km} ${locale === 'ar-EG' ? 'كم' : 'km'}`;
}
