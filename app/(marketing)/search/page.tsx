import type { Metadata } from 'next';

import type { PetRow, PublicSitterRow, ServiceType } from '@/lib/database.types';
import { spreadPin } from '@/lib/geo';
import { availabilityTier, findMatchingSitters } from '@/lib/matching';
import {
  applyFilters,
  parseFilterKeys,
  parseSort,
  sortSitters,
} from '@/lib/search-options';
import { SERVICE_BY_TYPE, SERVICES, serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';

import { SearchFilters } from './search-filters';
import { SearchResults, type ResultItem } from './search-results';

export const metadata: Metadata = { title: 'Find a Havener' };

type SearchParams = {
  service?: string;
  species?: string;
  address?: string;
  lat?: string;
  lng?: string;
  startDate?: string;
  endDate?: string;
  f?: string | string[];
  sort?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const validService = SERVICES.some((s) => s.type === params.service);
  const service = (validService ? params.service : '') as ServiceType | '';
  const address = params.address?.trim() ?? '';
  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const origin =
    params.lat && params.lng && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : null;
  const startDate = params.startDate?.trim() ?? '';
  const endDate = params.endDate?.trim() || startDate;
  const filters = parseFilterKeys(params.f);
  const sort = parseSort(params.sort);

  // A signed-in owner's own pet is the sensible starting point for the pet
  // filter. It's only a form default — nothing is searched until dates, a
  // service and an address are chosen and the form is submitted.
  let species = params.species ?? '';
  const hasFormInput = Boolean(params.startDate || params.service || params.species);
  if (!hasFormInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: firstPet } = await supabase
        .from('pets')
        .select('species')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const pet = firstPet as Pick<PetRow, 'species'> | null;
      if (pet) species = pet.species;
    }
  }

  // No Haveners until the owner has said when, what and where. Showing
  // everyone up front would suggest people who may not fit or be free.
  const ready = Boolean(startDate && service && origin);

  let sitters: PublicSitterRow[] = [];
  let rateBySitter = new Map<string, number>();
  let distanceBySitter = new Map<string, number>();
  let matched = 0;
  if (ready && origin) {
    // A Havener searching as an owner never sees their own listing.
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser();
    const result = await findMatchingSitters(supabase, {
      service: service as ServiceType,
      startDate,
      endDate,
      species,
      origin,
      excludeId: viewer?.id,
    });
    matched = result.sitters.length;
    rateBySitter = result.rateBySitter;
    distanceBySitter = result.distanceBySitter;
    sitters = sortSitters(
      applyFilters(result.sitters, filters),
      sort,
      distanceBySitter,
      rateBySitter
    );
  }

  // Carried into each profile so the contact summary starts from this search.
  const profileQuery = new URLSearchParams();
  if (startDate) {
    profileQuery.set('startDate', startDate);
    profileQuery.set('endDate', endDate || startDate);
  }
  if (service) profileQuery.set('service', service);
  const profileQueryString = profileQuery.toString();

  const rateUnit = service ? SERVICE_BY_TYPE[service as ServiceType].rateUnit : 'night';
  const items: ResultItem[] = sitters.map((sitter) => {
    const miles = distanceBySitter.get(sitter.id);
    const why = [
      'Free for your dates',
      ...(miles != null ? [`${miles < 0.1 ? '<0.1' : miles.toFixed(1)} mi away`] : []),
      ...(availabilityTier(sitter.calendar_updated_at) === 0 ? ['Active today'] : []),
    ];
    return {
      id: sitter.id,
      name: sitter.display_name ?? 'Havener',
      avatarUrl: sitter.avatar_url,
      headline: sitter.headline,
      location: [sitter.service_city, sitter.service_state].filter(Boolean).join(', ') || null,
      rating: sitter.rating,
      reviews: sitter.review_count,
      stays: sitter.completed_bookings,
      rate: rateBySitter.get(sitter.id) ?? null,
      rateUnit,
      miles: miles ?? null,
      why,
      certified: sitter.is_certified,
      insured: sitter.is_insured,
      backgroundChecked: sitter.background_checked,
      href: `/sitters/${sitter.id}${profileQueryString ? `?${profileQueryString}` : ''}`,
      pin:
        sitter.latitude != null && sitter.longitude != null
          ? spreadPin({ lat: sitter.latitude, lng: sitter.longitude }, sitter.id)
          : null,
    };
  });

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">Find a Havener</h1>
      <p className="mt-2 max-w-xl text-[17px] text-espresso-500">
        We only show you Haveners who genuinely fit — compatibility comes
        before popularity.
      </p>

      <SearchFilters
        defaults={{
          startDate,
          endDate: params.endDate?.trim() ?? '',
          service,
          species,
          address,
          lat: origin?.lat ?? null,
          lng: origin?.lng ?? null,
          filters,
          sort,
        }}
      />

      {!ready ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
          Choose your dates, the service you need and your address, then search —
          we’ll show the Haveners near you who fit your pet and are free for
          those dates.
        </p>
      ) : (
        <>
          <p className="mb-5 mt-8 text-[17px] text-espresso-500">
            {sitters.length} Havener{sitters.length === 1 ? '' : 's'} found
            {service ? ` for ${serviceName(service as ServiceType)}` : ''} ·
            available for your dates
            {filters.length > 0 && matched !== sitters.length
              ? ` · ${matched - sitters.length} hidden by your filters`
              : ''}
          </p>

          {sitters.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
              {filters.length > 0 && matched > 0
                ? 'No Haveners match all of those filters. Try removing one.'
                : 'No Haveners fit those dates yet. Try a different range or widen your search.'}
            </p>
          ) : (
            <SearchResults items={items} origin={origin} />
          )}
        </>
      )}
    </div>
  );
}
