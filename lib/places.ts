/**
 * Address lookup / autocomplete, backed by Photon (a free search layer over
 * OpenStreetMap data — no API key). It's the same OSM data family the walk
 * map already uses. Swapping to Google Places or Mapbox later only means
 * changing this one file: everything else calls searchPlaces()/geocode().
 */

import type { LatLng } from '@/lib/geo';

export type PlaceSuggestion = {
  /** What to show in the dropdown and store as the address text. */
  label: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

// Bias results toward the Boston area, where Havenr operates.
const BIAS = { lat: 42.3601, lng: -71.0589 };

function formatLabel(p: PhotonFeature['properties']): string | null {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const first = street || p.name || null;
  const place = p.city ?? p.district ?? p.county ?? null;
  const region = [p.state, p.postcode].filter(Boolean).join(' ');
  const parts = [first, place, region].filter(Boolean);
  // A bare state or country isn't an address anyone can be sent to.
  return parts.length >= 2 ? parts.join(', ') : null;
}

export async function searchPlaces(query: string, limit = 6): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', String(limit * 2));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('lat', String(BIAS.lat));
  url.searchParams.set('lon', String(BIAS.lng));

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Havenr/1.0 (address autocomplete)' },
      next: { revalidate: 60 * 60 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { features?: PhotonFeature[] };

    const seen = new Set<string>();
    const results: PlaceSuggestion[] = [];
    for (const feature of data.features ?? []) {
      if (feature.properties.countrycode && feature.properties.countrycode !== 'US') continue;
      const label = formatLabel(feature.properties);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      const [lng, lat] = feature.geometry.coordinates;
      results.push({ label, lat, lng });
      if (results.length >= limit) break;
    }
    return results;
  } catch {
    return [];
  }
}

/** Best single match for free text like "Medford, MA 02155" — null if nothing fits. */
export async function geocode(query: string): Promise<LatLng | null> {
  const [first] = await searchPlaces(query, 1);
  return first ? { lat: first.lat, lng: first.lng } : null;
}
