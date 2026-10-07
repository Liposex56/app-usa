import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type {
  PetRow,
  PublicSitterRow,
  ServiceType,
  SitterServiceRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { SERVICE_BY_TYPE, servicePickerLabel } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';

import { ContactForm, type ContactService } from './contact-form';

export const metadata: Metadata = { title: 'Contact this Havener' };

/** What the pre-written message says the Havener would be doing. */
const SERVICE_VERBS: Record<ServiceType, string> = {
  boarding: 'host',
  daycare: 'watch',
  house_sitting: 'house sit for',
  dog_walking: 'walk',
  drop_in_visit: 'visit',
};

export default async function ContactSitterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    service?: string;
    rebook?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  // Signed-out visitors come back to this exact request after logging in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const qs = new URLSearchParams(
      Object.entries(query).filter((entry): entry is [string, string] => Boolean(entry[1]))
    ).toString();
    redirect(`/login?next=${encodeURIComponent(`/sitters/${id}/contact${qs ? `?${qs}` : ''}`)}`);
  }

  const profile = await requireProfile();
  if (profile.id === id) redirect(`/sitters/${id}`);

  const [{ data: sitter }, { data: services }, { data: pets }] = await Promise.all([
    supabase.from('public_sitters').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('sitter_services')
      .select('*')
      .eq('sitter_id', id)
      .eq('is_active', true),
    supabase
      .from('pets')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: true }),
  ]);

  if (!sitter) notFound();

  const sitterRow = sitter as PublicSitterRow;
  const serviceRows = (services ?? []) as SitterServiceRow[];
  const petRows = (pets ?? []) as PetRow[];
  const firstName = (sitterRow.display_name ?? 'there').split(' ')[0];

  const contactServices: ContactService[] = serviceRows.map((row) => {
    const definition = SERVICE_BY_TYPE[row.service_type];
    return {
      type: row.service_type,
      pickerLabel: servicePickerLabel(definition),
      verb: SERVICE_VERBS[row.service_type],
      rateUnit: definition.rateUnit,
      baseRateCents: row.base_rate_cents,
      additionalPetRateCents: row.additional_pet_rate_cents,
      pickupDropoffRateCents: row.pickup_dropoff_rate_cents,
    };
  });

  return (
    <div className="container-page max-w-2xl py-8 sm:py-10">
      <Link
        href={`/sitters/${id}`}
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to {sitterRow.display_name ?? 'profile'}
      </Link>

      <h1 className="mt-4 text-2xl sm:text-3xl">
        Contact {sitterRow.display_name ?? 'this Havener'}
      </h1>
      <p className="mt-1 text-sm text-espresso-500">
        Check the details below — you can change anything before you send it.
      </p>

      {serviceRows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-espresso-700/10 bg-white p-6 text-sm text-espresso-500">
          This Havener hasn&rsquo;t published any services yet.
        </p>
      ) : petRows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-espresso-700/10 bg-white p-6 text-sm text-espresso-600">
          You need at least one pet on file before contacting a Havener.{' '}
          <Link
            href={`/dashboard/pets/new?returnTo=${encodeURIComponent(`/sitters/${id}/contact`)}`}
            className="font-medium text-gold-600"
          >
            Add a pet →
          </Link>
        </div>
      ) : (
        <ContactForm
          sitterId={id}
          sitterFirstName={firstName}
          services={contactServices}
          pets={petRows.map((p) => ({ id: p.id, name: p.name, species: p.species }))}
          initialService={query.service}
          initialStartDate={query.startDate}
          initialEndDate={query.endDate}
          rebook={query.rebook === '1'}
        />
      )}
    </div>
  );
}
