import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCheck, IconMapPin, IconShield, IconStar } from '@/components/icons';
import { Field, Input, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import type {
  EnergyLevel,
  PetSize,
  PublicSitterRow,
  ServiceType,
  SitterServiceRow,
} from '@/lib/database.types';
import { SERVICES, serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils';

export const metadata: Metadata = { title: 'Find a Havener' };

type SearchParams = {
  service?: string;
  species?: string;
  city?: string;
  state?: string;
  size?: string;
  energy?: string;
  insured?: string;
  certified?: string;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const service = (params.service ?? '') as ServiceType | '';
  const species = params.species ?? '';
  const city = params.city?.trim() ?? '';
  const state = params.state?.trim() ?? '';
  const size = (params.size ?? '') as PetSize | '';
  const energy = (params.energy ?? '') as EnergyLevel | '';
  const insuredOnly = params.insured === '1';
  const certifiedOnly = params.certified === '1';

  const supabase = await createClient();

  // Services narrow the candidate sitter set first — a sitter with no
  // matching, active service for the requested type/species is excluded
  // outright, same as the proposal's "compatibility before popularity" rule.
  let matchingServices: SitterServiceRow[] | null = null;
  if (service) {
    let servicesQuery = supabase
      .from('sitter_services')
      .select('*')
      .eq('service_type', service)
      .eq('is_active', true);
    if (species === 'dog') servicesQuery = servicesQuery.eq('accepts_dogs', true);
    if (species === 'cat') servicesQuery = servicesQuery.eq('accepts_cats', true);
    const { data } = await servicesQuery;
    matchingServices = (data ?? []) as SitterServiceRow[];
  }

  let sittersQuery = supabase.from('public_sitters').select('*');

  if (matchingServices) {
    const ids = matchingServices.map((row) => row.sitter_id);
    if (ids.length === 0) {
      // Nothing to render — skip straight to an empty result set below.
      sittersQuery = sittersQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      sittersQuery = sittersQuery.in('id', ids);
    }
  }
  if (city) sittersQuery = sittersQuery.ilike('service_city', `%${city}%`);
  if (state) sittersQuery = sittersQuery.ilike('service_state', `%${state}%`);
  if (species === 'dog') sittersQuery = sittersQuery.eq('accepts_dogs', true);
  if (species === 'cat') sittersQuery = sittersQuery.eq('accepts_cats', true);
  if (size) sittersQuery = sittersQuery.contains('accepted_sizes', [size]);
  if (energy) sittersQuery = sittersQuery.contains('accepted_energy_levels', [energy]);
  if (insuredOnly) sittersQuery = sittersQuery.eq('is_insured', true);
  if (certifiedOnly) sittersQuery = sittersQuery.eq('is_certified', true);

  const { data: sitterRows } = await sittersQuery
    .order('rating', { ascending: false, nullsFirst: false })
    .order('review_count', { ascending: false });

  const sitters = (sitterRows ?? []) as PublicSitterRow[];
  const rateBySitter = new Map<string, number>();
  matchingServices?.forEach((row) => {
    rateBySitter.set(row.sitter_id, row.base_rate_cents);
  });

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl">Find a Havener</h1>
      <p className="mt-2 max-w-xl text-[15px] text-espresso-500">
        We only show you Haveners who genuinely fit — compatibility comes
        before popularity.
      </p>

      <form className="mt-8 grid gap-4 rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Service" htmlFor="service">
          <Select id="service" name="service" defaultValue={service}>
            <option value="">Any service</option>
            {SERVICES.map((s) => (
              <option key={s.type} value={s.type}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pet" htmlFor="species">
          <Select id="species" name="species" defaultValue={species}>
            <option value="">Dog or cat</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </Select>
        </Field>
        <Field label="Size" htmlFor="size">
          <Select id="size" name="size" defaultValue={size}>
            <option value="">Any size</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="giant">Giant</option>
          </Select>
        </Field>
        <Field label="Energy level" htmlFor="energy">
          <Select id="energy" name="energy" defaultValue={energy}>
            <option value="">Any energy</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={city} placeholder="Austin" />
        </Field>
        <Field label="State" htmlFor="state">
          <Input id="state" name="state" defaultValue={state} placeholder="TX" />
        </Field>
        <div className="flex items-end gap-5 sm:col-span-2 lg:col-span-1">
          <label className="flex items-center gap-2 text-sm text-espresso-700">
            <input
              type="checkbox"
              name="insured"
              value="1"
              defaultChecked={insuredOnly}
              className="h-4 w-4 accent-gold-500"
            />
            Insured only
          </label>
          <label className="flex items-center gap-2 text-sm text-espresso-700">
            <input
              type="checkbox"
              name="certified"
              value="1"
              defaultChecked={certifiedOnly}
              className="h-4 w-4 accent-gold-500"
            />
            Certified only
          </label>
        </div>
        <div className="flex items-end lg:col-span-1">
          <Button type="submit" className="w-full">
            Search
          </Button>
        </div>
      </form>

      <p className="mt-8 text-sm text-espresso-500">
        {sitters.length} Havener{sitters.length === 1 ? '' : 's'} found
        {service ? ` for ${serviceName(service)}` : ''}
      </p>

      {sitters.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          No Haveners match those filters yet. Try widening your search.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sitters.map((sitter) => (
            <Link
              key={sitter.id}
              href={`/sitters/${sitter.id}`}
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

              <div className="mt-4 flex items-center justify-between border-t border-espresso-700/8 pt-3 text-sm">
                <span className="text-espresso-500">
                  {sitter.rating ? `★ ${sitter.rating.toFixed(1)}` : 'New Havener'} ·{' '}
                  {sitter.review_count} review{sitter.review_count === 1 ? '' : 's'}
                </span>
                {service && rateBySitter.has(sitter.id) && (
                  <span className="font-medium text-espresso-700">
                    from {formatCents(rateBySitter.get(sitter.id)!)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
