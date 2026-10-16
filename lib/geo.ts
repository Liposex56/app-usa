export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Display-only nudge so Haveners who share an area don't sit on one pin. The
 * stored location is already coarse (0019), so this reveals nothing; it only
 * spreads pins by about a quarter to half a mile, the same way every time.
 */
export function spreadPin(point: LatLng, seed: string): LatLng {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const angle = (((hash >>> 0) % 3600) / 3600) * 2 * Math.PI;
  const radius = 0.0035 + (((hash >>> 12) % 100) / 100) * 0.0035;
  return {
    lat: point.lat + Math.sin(angle) * radius,
    lng: point.lng + (Math.cos(angle) * radius) / Math.cos((point.lat * Math.PI) / 180),
  };
}

/** Great-circle distance between two points, in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}
