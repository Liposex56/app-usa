import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type { PetRow, PublicSitterRow, SitterServiceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { serviceName } from '@/lib/services';

import { BookingForm } from './book-form';

export const metadata: Metadata = { title: 'Request a booking' };

export default async function BookSitterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();

  if (profile.id === id) redirect(`/sitters/${id}`);

  const supabase = await createClient();
  const [{ data: sitter }, { data: services }, { data: pets }] = await Promise.all([
    supabase.from('public_sitters').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('sitter_services')
      .select('*')
      .eq('sitter_id', id)
      .eq('is_active', true),
    supabase.from('pets').select('*').eq('owner_id', profile.id),
  ]);

  if (!sitter) notFound();

  const serviceRows = (services ?? []) as SitterServiceRow[];
  const petRows = (pets ?? []) as PetRow[];

  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <Link
        href={`/sitters/${id}`}
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to {(sitter as PublicSitterRow).display_name ?? 'profile'}
      </Link>

      <h1 className="mt-6 text-3xl">
        Request a booking with {(sitter as PublicSitterRow).display_name ?? 'this Havener'}
      </h1>
      <p className="mt-2 text-[15px] text-espresso-500">
        Nothing is charged yet — the Havener will accept or decline before
        anything is confirmed.
      </p>

      {serviceRows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-espresso-700/10 bg-white p-6 text-sm text-espresso-500">
          This Havener hasn&rsquo;t published any services yet.
        </p>
      ) : petRows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-espresso-700/10 bg-white p-6 text-sm text-espresso-600">
          You need at least one pet on file before requesting a booking.{' '}
          <Link href="/dashboard/pets/new" className="font-medium text-gold-600">
            Add a pet →
          </Link>
        </div>
      ) : (
        <BookingForm
          sitterId={id}
          services={serviceRows.map((s) => ({
            type: s.service_type,
            name: serviceName(s.service_type),
            baseRateCents: s.base_rate_cents,
            additionalPetRateCents: s.additional_pet_rate_cents,
          }))}
          pets={petRows.map((p) => ({ id: p.id, name: p.name, species: p.species }))}
        />
      )}
    </div>
  );
}
