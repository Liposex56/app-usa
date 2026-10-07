import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCheck, IconMapPin, IconShield, IconStar } from '@/components/icons';
import type {
  EnergyLevel,
  PetRow,
  PetSize,
  PublicSitterRow,
  ServiceType,
} from '@/lib/database.types';
import { availabilityLabel, findMatchingSitters } from '@/lib/matching';
import { SERVICES, serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils';

import { SearchFilters } from './search-filters';

export const metadata: Metadata = { title: 'Find a Havener' };

type SearchParams = {
  service?: string;
  species?: string;
  city?: string;
  state?: string;
  size?: string;
  energy?: string;
  startDate?: string;
  endDate?: string;
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
  const city = params.city?.trim() ?? '';
  const state = params.state?.trim() ?? '';
  const startDate = params.startDate?.trim() ?? '';
  const endDate = params.endDate?.trim() || startDate;

  // A signed-in owner's own pet is the sensible starting point for the
  // pet / size filters. These are only form defaults — nothing is searched
  // until dates and a service are chosen and the form is submitted.
  let species = params.species ?? '';
  let size = (params.size ?? '') as PetSize | '';
  const energy = (params.energy ?? '') as EnergyLevel | '';
  const hasFormInput = Boolean(params.startDate || params.service || params.species);
  if (!hasFormInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: firstPet } = await supabase
        .from('pets')
        .select('species, size')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const pet = firstPet as Pick<PetRow, 'species' | 'size'> | null;
      if (pet) {
        species = pet.species;
        size = pet.species === 'dog' ? (pet.size ?? '') : '';
      }
    }
  }

  // No Haveners until the owner has said when and what they need. Showing
  // everyone up front would suggest people who may not fit or be free.
  const ready = Boolean(startDate && service);

  let sitters: PublicSitterRow[] = [];
  let rateBySitter = new Map<string, number>();
  if (ready) {
    const result = await findMatchingSitters(supabase, {
      service: service as ServiceType,
      startDate,
      endDate,
      species,
      size,
      energy,
      city,
      state,
    });
    sitters = result.sitters;
    rateBySitter = result.rateBySitter;
  }

  const profileQuery = new URLSearchParams();
  if (startDate) {
    profileQuery.set('startDate', startDate);
    profileQuery.set('endDate', endDate || startDate);
  }
  if (service) profileQuery.set('service', service);
  const profileQueryString = profileQuery.toString();

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl">Find a Havener</h1>
      <p className="mt-2 max-w-xl text-[15px] text-espresso-500">
        We only show you Haveners who genuinely fit — compatibility comes
        before popularity.
      </p>

      <SearchFilters
        defaults={{
          startDate,
          endDate: params.endDate?.trim() ?? '',
          service,
          species,
          size,
          energy,
          city,
          state,
        }}
      />

      {!ready ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          Choose your dates and the service you need, then search — we’ll show
          the Haveners who fit your pet and are free for those dates.
        </p>
      ) : (
        <>
          <p className="mt-8 text-sm text-espresso-500">
            {sitters.length} Havener{sitters.length === 1 ? '' : 's'} found
            {service ? ` for ${serviceName(service as ServiceType)}` : ''} ·
            available for your dates
          </p>

          {sitters.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
              No Haveners fit those dates and filters yet. Try a different range
              or widen your search.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sitters.map((sitter) => {
                const updated = availabilityLabel(sitter.calendar_updated_at);
                return (
                  <Link
                    key={sitter.id}
                    href={`/sitters/${sitter.id}${profileQueryString ? `?${profileQueryString}` : ''}`}
                    className="flex flex-col rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky-100">
                        {sitter.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sitter.avatar_url}
                            alt={sitter.display_name ?? 'Havener'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-medium text-espresso-500">
                            {(sitter.display_name ?? 'H').slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-espresso-700">
                          {sitter.display_name ?? 'Havener'}
                        </p>
                        {(sitter.service_city || sitter.service_state) && (
                          <p className="inline-flex items-center gap-1 text-xs text-espresso-500">
                            <IconMapPin className="h-3.5 w-3.5" />
                            {[sitter.service_city, sitter.service_state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {sitter.headline && (
                      <p className="mt-3 line-clamp-2 text-sm text-espresso-600">
                        {sitter.headline}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sitter.is_certified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                          <IconStar className="h-3 w-3" /> Certified
                        </span>
                      )}
                      {sitter.is_insured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <IconShield className="h-3 w-3" /> Insured
                        </span>
                      )}
                      {sitter.background_checked && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <IconCheck className="h-3 w-3" /> Background checked
                        </span>
                      )}
                    </div>

                    {updated && (
                      <p className="mt-3 text-xs text-olive-600">{updated}</p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-espresso-700/8 pt-3 text-sm">
                      <span className="text-espresso-500">
                        {sitter.rating ? `★ ${sitter.rating.toFixed(1)}` : 'New Havener'} ·{' '}
                        {sitter.review_count} review{sitter.review_count === 1 ? '' : 's'}
                      </span>
                      {rateBySitter.has(sitter.id) && (
                        <span className="font-medium text-espresso-700">
                          from {formatCents(rateBySitter.get(sitter.id)!)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
