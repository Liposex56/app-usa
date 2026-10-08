import type { SupabaseClient } from '@supabase/supabase-js';

import { sitterIdsWithConflict } from '@/lib/availability';
import { distanceMiles, type LatLng } from '@/lib/geo';
import type {
  Database,
  EnergyLevel,
  PetSize,
  PublicSitterRow,
  ServiceType,
  SitterServiceRow,
} from '@/lib/database.types';

export type SitterCriteria = {
  service: ServiceType;
  startDate: string;
  endDate: string;
  species?: string;
  size?: PetSize | '';
  energy?: EnergyLevel | '';
  city?: string;
  state?: string;
  excludeId?: string;
  /** Where the pet owner is. Haveners farther than their own service radius are left out. */
  origin?: LatLng;
};

const HOUR_MS = 36e5;

/** 0 = updated in the last day, 1 = last three days, 2 = older or never. */
export function availabilityTier(updatedAt: string | null, now = Date.now()): 0 | 1 | 2 {
  if (!updatedAt) return 2;
  const hours = (now - new Date(updatedAt).getTime()) / HOUR_MS;
  if (hours <= 24) return 0;
  if (hours <= 72) return 1;
  return 2;
}

/**
 * Haveners who refresh their availability every day are rewarded with the
 * top spots; ties fall back to rating and then review count.
 */
export function rankSitters<
  T extends Pick<PublicSitterRow, 'id' | 'calendar_updated_at' | 'rating' | 'review_count'>,
>(sitters: T[], distances?: Map<string, number>): T[] {
  const now = Date.now();
  return [...sitters].sort((a, b) => {
    const tier = availabilityTier(a.calendar_updated_at, now) - availabilityTier(b.calendar_updated_at, now);
    if (tier !== 0) return tier;
    // Within the same freshness tier, nearer Haveners first; unknown distance last.
    const da = distances?.get(a.id) ?? Number.POSITIVE_INFINITY;
    const db = distances?.get(b.id) ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da < db ? -1 : 1;
    const rating = (b.rating ?? -1) - (a.rating ?? -1);
    if (rating !== 0) return rating;
    return b.review_count - a.review_count;
  });
}

/** "Availability updated today" / "…2 days ago", or null if they never have. */
export function availabilityLabel(updatedAt: string | null): string | null {
  if (!updatedAt) return null;
  const hours = (Date.now() - new Date(updatedAt).getTime()) / HOUR_MS;
  if (hours < 1) return 'Availability updated just now';
  if (hours < 24) return 'Availability updated today';
  if (hours < 48) return 'Availability updated yesterday';
  return `Availability updated ${Math.floor(hours / 24)} days ago`;
}

/**
 * Approved Haveners who genuinely fit a service request: they offer the
 * service for that species, accept the pet's size and energy, and are free
 * for the dates. Shared by search and the "consider additional Haveners"
 * step so both apply the same compatibility-before-popularity rule.
 */
export async function findMatchingSitters(
  supabase: SupabaseClient<Database>,
  criteria: SitterCriteria
): Promise<{
  sitters: PublicSitterRow[];
  rateBySitter: Map<string, number>;
  serviceBySitter: Map<string, SitterServiceRow>;
  distanceBySitter: Map<string, number>;
}> {
  const { service, species, size, energy, city, state, startDate, endDate, excludeId, origin } =
    criteria;
  const distanceBySitter = new Map<string, number>();

  let servicesQuery = supabase
    .from('sitter_services')
    .select('*')
    .eq('service_type', service)
    .eq('is_active', true);
  if (species === 'dog') servicesQuery = servicesQuery.eq('accepts_dogs', true);
  if (species === 'cat') servicesQuery = servicesQuery.eq('accepts_cats', true);
  const { data: serviceRows } = await servicesQuery;
  const matchingServices = (serviceRows ?? []) as SitterServiceRow[];

  const rateBySitter = new Map<string, number>();
  const serviceBySitter = new Map<string, SitterServiceRow>();
  matchingServices.forEach((row) => {
    rateBySitter.set(row.sitter_id, row.base_rate_cents);
    serviceBySitter.set(row.sitter_id, row);
  });

  const ids = matchingServices.map((row) => row.sitter_id).filter((id) => id !== excludeId);
  if (ids.length === 0) return { sitters: [], rateBySitter, serviceBySitter, distanceBySitter };

  let sittersQuery = supabase.from('public_sitters').select('*').in('id', ids);
  if (city) sittersQuery = sittersQuery.ilike('service_city', `%${city}%`);
  if (state) sittersQuery = sittersQuery.ilike('service_state', `%${state}%`);
  if (species === 'dog') sittersQuery = sittersQuery.eq('accepts_dogs', true);
  if (species === 'cat') sittersQuery = sittersQuery.eq('accepts_cats', true);
  if (size && species !== 'cat') sittersQuery = sittersQuery.contains('accepted_sizes', [size]);
  if (energy) sittersQuery = sittersQuery.contains('accepted_energy_levels', [energy]);

  const { data: sitterRows } = await sittersQuery;
  let sitters = (sitterRows ?? []) as PublicSitterRow[];

  // No manual accept step used to exist, so this filter is what keeps a
  // Havener with a schedule conflict from ever being shown for those dates.
  const conflicts = await sitterIdsWithConflict(
    supabase,
    startDate,
    endDate,
    sitters.map((s) => s.id)
  );
  sitters = sitters.filter((s) => !conflicts.has(s.id));

  if (origin) {
    // A Havener without a saved location can't be measured, so they stay in
    // rather than silently vanishing; everyone else must be within the
    // distance they say they work in.
    sitters = sitters.filter((s) => {
      if (s.latitude == null || s.longitude == null) return true;
      const miles = distanceMiles(origin, { lat: s.latitude, lng: s.longitude });
      distanceBySitter.set(s.id, miles);
      return miles <= (s.service_radius_miles ?? 10);
    });
  }

  return { sitters: rankSitters(sitters, distanceBySitter), rateBySitter, serviceBySitter, distanceBySitter };
}
