import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { IconCheck } from '@/components/icons';
import type { BookingRow, PetRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { findMatchingSitters } from '@/lib/matching';
import { computeBookingTotals } from '@/lib/pricing';
import { SERVICE_BY_TYPE } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

import { AdditionalHaveners, type AdditionalHavener } from './additional-haveners';

export const metadata: Metadata = { title: 'Request sent' };

export default async function ContactSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ booking?: string }>;
}) {
  const { id } = await params;
  const { booking: bookingId } = await searchParams;
  if (!bookingId) notFound();

  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: bookingRow }, { data: sitter }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('owner_id', profile.id)
      .maybeSingle(),
    supabase.from('public_sitters').select('display_name').eq('id', id).maybeSingle(),
  ]);
  if (!bookingRow) notFound();
  const booking = bookingRow as BookingRow;
  const bookingHref = `/dashboard/bookings/${booking.id}`;

  const { data: links } = await supabase
    .from('booking_pets')
    .select('pet_id')
    .eq('booking_id', booking.id);
  const petIds = (links ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = petIds.length
    ? await supabase.from('pets').select('*').in('id', petIds)
    : { data: [] as PetRow[] };
  const pets = (petRows ?? []) as PetRow[];
  const firstPet = pets[0];

  const endDate = booking.end_date ?? booking.start_date;

  // Haveners already contacted for this same stay shouldn't be suggested again.
  const { data: sameRequests } = await supabase
    .from('bookings')
    .select('sitter_id')
    .eq('owner_id', profile.id)
    .eq('service_type', booking.service_type)
    .eq('start_date', booking.start_date)
    .in('status', ['requested', 'confirmed']);
  const alreadyContacted = new Set((sameRequests ?? []).map((row) => row.sitter_id as string));

  const { sitters, serviceBySitter } = await findMatchingSitters(supabase, {
    service: booking.service_type,
    startDate: booking.start_date,
    endDate,
    species: firstPet?.species,
    size: firstPet?.species === 'dog' ? (firstPet.size ?? '') : '',
    energy: firstPet?.energy_level ?? '',
    excludeId: id,
  });

  const definition = SERVICE_BY_TYPE[booking.service_type];
  const dateQuery = `startDate=${booking.start_date}&endDate=${endDate}&service=${booking.service_type}`;

  const suggestions: AdditionalHavener[] = sitters
    .filter((s) => !alreadyContacted.has(s.id))
    .slice(0, 3)
    .flatMap((s) => {
      const service = serviceBySitter.get(s.id);
      if (!service) return [];
      const totals = computeBookingTotals({
        service,
        rateUnit: definition.rateUnit,
        startDate: booking.start_date,
        endDate: booking.end_date,
        petCount: Math.max(1, pets.length),
        wantsPickupDropoff: false,
      });
      return [
        {
          id: s.id,
          name: s.display_name ?? 'Havener',
          location: [s.service_city, s.service_state].filter(Boolean).join(', ') || null,
          avatarUrl: s.avatar_url,
          rating: s.rating,
          reviewCount: s.review_count,
          totalLabel: `${formatCents(totals.totalCents)} total`,
          previewHref: `/sitters/${s.id}?${dateQuery}`,
        },
      ];
    });

  // Nobody else fits — nothing to recommend, go straight to the request.
  if (suggestions.length === 0) redirect(bookingHref);

  return (
    <div className="container-page max-w-2xl py-8 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-green-700 text-green-700">
          <IconCheck className="h-5 w-5" />
        </span>
        <h1 className="text-2xl sm:text-3xl">
          Request sent to {sitter?.display_name ?? 'the Havener'}
        </h1>
      </div>
      <p className="mt-3 text-sm text-espresso-600">
        {definition.name} · starts {formatDate(booking.start_date)} · {pets.length} pet
        {pets.length === 1 ? '' : 's'} · {formatCents(booking.total_cents)} total
      </p>

      <h2 className="mt-8 text-lg font-semibold text-espresso-700">
        Consider additional Havener{suggestions.length === 1 ? '' : 's'}
      </h2>
      <p className="mt-2 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Boost your chances of finding a great match by reaching out to more
        Haveners. These all fit your pet and are free for your dates.
      </p>

      <div className="mt-4">
        <AdditionalHaveners
          bookingId={booking.id}
          haveners={suggestions}
          skipHref={bookingHref}
        />
      </div>
    </div>
  );
}
