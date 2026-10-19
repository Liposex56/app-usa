'use server';

import { redirect } from 'next/navigation';

import type { PetRow, ServiceType, SitterServiceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { sitterIdsWithConflict } from '@/lib/availability';
import { scheduleLines } from '@/lib/booking-notes';
import { isTimedService, timeLabels } from '@/lib/booking-flow';
import { filterChatMessage } from '@/lib/chat-filter';
import { findMatchingSitters } from '@/lib/matching';
import { computeFeeSplit } from '@/lib/payments';
import { loadCommissionPercent } from '@/lib/rate-context';
import { createClient } from '@/lib/supabase/server';
import { bool, list, petAge, text } from '@/lib/utils';

export type ContactState = { error: string | null };

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * A Havener can't read a pet's profile until a booking moves past the request
 * stage (see sitter_has_booking_for_pet), so the request itself carries the
 * handful of facts they need to decide — never medical or private notes.
 */
function petSummaryLine(pet: PetRow): string {
  const details = [
    pet.species === 'dog' ? 'Dog' : 'Cat',
    pet.breed,
    pet.weight_lb ? `${pet.weight_lb} lb` : null,
    petAge(pet.birthdate),
  ].filter(Boolean);
  return `${pet.name} — ${details.join(', ')}`;
}

type RequestInput = {
  ownerId: string;
  sitterId: string;
  service: SitterServiceRow;
  startDate: string;
  endDate: string | null;
  pets: PetRow[];
  dropoffFrom: string | null;
  dropoffTo: string | null;
  pickupFrom: string | null;
  pickupTo: string | null;
  wantsPickupDropoff: boolean;
  /** 30 or 60 for walks and drop-in visits; null for the other services. */
  durationMinutes: number | null;
  message: string;
  flagged: boolean;
  flaggedReason: string | null;
};

async function createContactRequest(
  supabase: Supabase,
  input: RequestInput
): Promise<{ bookingId: string } | { error: string }> {
  const { service, pets, startDate, endDate } = input;

  const commissionPercent = await loadCommissionPercent(supabase);

  // The database prices the stay (holiday and extended-stay rules included),
  // so nobody can post their own total.
  const { data: priceRows, error: priceError } = await supabase.rpc('stay_price', {
    p_sitter: input.sitterId,
    p_service: service.service_type,
    p_start: startDate,
    p_end: endDate,
    p_pets: pets.length,
    p_pickup: input.wantsPickupDropoff,
  });
  const price = priceRows?.[0];
  if (priceError || !price) {
    return { error: priceError?.message ?? 'Could not price this request.' };
  }
  const split = computeFeeSplit(price.total_cents, commissionPercent);

  const summary = [
    `Pets: ${pets.map(petSummaryLine).join('; ')}`,
    ...(input.durationMinutes ? [`Length: ${input.durationMinutes} minutes`] : []),
    ...scheduleLines({
      dropoffFrom: input.dropoffFrom,
      dropoffTo: input.dropoffTo,
      pickupFrom: input.pickupFrom,
      pickupTo: input.pickupTo,
      wantsPickupDropoff: input.wantsPickupDropoff,
      pickupDropoffRateCents: service.pickup_dropoff_rate_cents,
    }),
  ].join('\n');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking, error } = await (supabase.from('bookings') as any)
    .insert({
      owner_id: input.ownerId,
      sitter_id: input.sitterId,
      service_type: service.service_type,
      // The Havener answers this — it only becomes `confirmed` when they accept.
      status: 'requested',
      start_date: startDate,
      end_date: endDate,
      owner_notes: summary,
      dropoff_from: input.dropoffFrom,
      dropoff_to: input.dropoffTo,
      pickup_from: input.pickupFrom,
      pickup_to: input.pickupTo,
      wants_pickup_dropoff: input.wantsPickupDropoff,
      duration_minutes: input.durationMinutes,
      rate_kind: price.rate_kind,
      base_rate_cents: price.unit_cents,
      additional_pet_rate_cents: price.additional_cents,
      extra_fees_cents: price.extra_cents,
      commission_percent: commissionPercent,
      platform_fee_cents: split.companyFeeCents,
      sitter_payout_cents: split.sitterPayoutCents,
      total_cents: price.total_cents,
    })
    .select('id')
    .single();

  if (error || !booking) {
    return { error: error?.message ?? 'Could not send the request.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: petsError } = await (supabase.from('booking_pets') as any).insert(
    pets.map((pet) => ({ booking_id: booking.id, pet_id: pet.id }))
  );
  if (petsError) return { error: petsError.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: messageError } = await (supabase.from('messages') as any).insert({
    booking_id: booking.id,
    sender_id: input.ownerId,
    recipient_id: input.sitterId,
    body: input.message,
    flagged: input.flagged,
    flagged_reason: input.flaggedReason,
  });
  if (messageError) return { error: messageError.message };

  return { bookingId: booking.id as string };
}

export async function contactHavenerAction(
  sitterId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const profile = await requireProfile();
  if (sitterId === profile.id) {
    return { error: 'You can’t send a request to your own Havener profile.' };
  }
  const supabase = await createClient();

  const serviceType = text(formData, 'serviceType') as ServiceType | null;
  const startDate = text(formData, 'startDate');
  const endDate = text(formData, 'endDate');
  const petIds = list(formData, 'petIds');
  const rawMessage = text(formData, 'message');

  if (!serviceType) return { error: 'Please choose a service.' };
  if (!startDate) return { error: 'Please choose the dates.' };
  if (endDate && endDate < startDate) {
    return { error: 'The end date can’t be before the start date.' };
  }
  if (petIds.length === 0) return { error: 'Please select at least one pet.' };
  if (!rawMessage) return { error: 'Please write a short message for the Havener.' };

  // Walks and drop-in visits have a booked length that can't be cut short.
  const needsDuration = serviceType === 'dog_walking' || serviceType === 'drop_in_visit';
  const durationChoice = Number(text(formData, 'durationMinutes'));
  if (needsDuration && ![30, 60].includes(durationChoice)) {
    return { error: 'Please choose how long you need — 30 or 60 minutes.' };
  }
  const durationMinutes = needsDuration ? durationChoice : null;

  // Boarding and house sitting run on these two times.
  const timed = isTimedService(serviceType);
  const dropoffFrom = text(formData, 'dropoffFrom');
  const pickupFrom = text(formData, 'pickupFrom');
  if (timed && (!dropoffFrom || !pickupFrom)) {
    const labels = timeLabels(serviceType);
    return {
      error: `Please choose the ${labels.start.toLowerCase()} and the ${labels.end.toLowerCase()} — the service starts and ends at those times.`,
    };
  }
  if (timed && !endDate && pickupFrom && dropoffFrom && pickupFrom <= dropoffFrom) {
    return {
      error: 'For a single day, the pick-up time has to be after the drop-off time.',
    };
  }

  const filtered = filterChatMessage(rawMessage);
  if (filtered.blocked) return { error: filtered.blockedReason };

  const conflicts = await sitterIdsWithConflict(
    supabase,
    startDate,
    endDate || startDate,
    [sitterId],
    { service: serviceType, pets: petIds.length }
  );
  if (conflicts.has(sitterId)) {
    return {
      error:
        'This Havener is no longer available for those dates. Please pick different dates or another Havener.',
    };
  }

  const { data: petRows } = await supabase
    .from('pets')
    .select('*')
    .eq('owner_id', profile.id)
    .in('id', petIds);
  const pets = (petRows ?? []) as PetRow[];
  if (pets.length !== petIds.length) {
    return { error: 'One of the selected pets could not be found.' };
  }

  const { data: serviceRow } = await supabase
    .from('sitter_services')
    .select('*')
    .eq('sitter_id', sitterId)
    .eq('service_type', serviceType)
    .eq('is_active', true)
    .maybeSingle();
  const service = serviceRow as SitterServiceRow | null;
  if (!service) return { error: 'This Havener no longer offers that service.' };

  const result = await createContactRequest(supabase, {
    ownerId: profile.id,
    sitterId,
    service,
    startDate,
    endDate: endDate || null,
    pets,
    dropoffFrom,
    // Timed services use one exact time each; others an optional preferred range.
    dropoffTo: timed ? null : text(formData, 'dropoffTo'),
    pickupFrom: timed ? pickupFrom : null,
    pickupTo: null,
    wantsPickupDropoff: bool(formData, 'wantsPickupDropoff'),
    durationMinutes,
    message: filtered.body,
    flagged: filtered.flagged,
    flaggedReason: filtered.flaggedReason,
  });
  if ('error' in result) return { error: result.error };

  redirect(`/sitters/${sitterId}/contact/sent?booking=${result.bookingId}`);
}

/**
 * Sends the same request to the extra Haveners the owner left ticked on the
 * "consider additional Haveners" step. The ids are re-validated against the
 * same matching rules, so a tampered form can't contact anyone who doesn't fit.
 */
export async function contactAdditionalHavenersAction(
  bookingId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const chosen = list(formData, 'sitterIds').slice(0, 3);
  if (chosen.length === 0) return { error: 'Select at least one Havener, or skip this step.' };

  const { data: original } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('owner_id', profile.id)
    .maybeSingle();
  if (!original) return { error: 'We couldn’t find your original request.' };

  const { data: links } = await supabase
    .from('booking_pets')
    .select('pet_id')
    .eq('booking_id', bookingId);
  const petIds = (links ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = await supabase.from('pets').select('*').in('id', petIds);
  const pets = (petRows ?? []) as PetRow[];
  if (pets.length === 0) return { error: 'We couldn’t find the pets on your request.' };

  const { data: firstMessage } = await supabase
    .from('messages')
    .select('body')
    .eq('booking_id', bookingId)
    .eq('sender_id', profile.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const message = (firstMessage as { body: string } | null)?.body;
  if (!message) return { error: 'We couldn’t find your original message.' };

  const startDate = original.start_date as string;
  const endDate = (original.end_date as string | null) ?? null;
  const first = pets[0];

  const { sitters, serviceBySitter } = await findMatchingSitters(supabase, {
    service: original.service_type as ServiceType,
    startDate,
    endDate: endDate || startDate,
    species: first.species,
    size: first.species === 'dog' ? (first.size ?? '') : '',
    energy: first.energy_level ?? '',
    excludeId: original.sitter_id as string,
    excludeIds: [profile.id],
  });
  const allowed = new Set(sitters.map((s) => s.id));


  for (const sitterId of chosen) {
    const service = serviceBySitter.get(sitterId);
    if (!allowed.has(sitterId) || !service) continue;

    const result = await createContactRequest(supabase, {
      ownerId: profile.id,
      sitterId,
      service,
      startDate,
      endDate,
      pets,
      // The same schedule and transport choice as the original request.
      dropoffFrom: (original.dropoff_from as string | null) ?? null,
      dropoffTo: (original.dropoff_to as string | null) ?? null,
      pickupFrom: (original.pickup_from as string | null) ?? null,
      pickupTo: (original.pickup_to as string | null) ?? null,
      wantsPickupDropoff: Boolean(original.wants_pickup_dropoff),
      durationMinutes: (original.duration_minutes as number | null) ?? null,
      message,
      flagged: false,
      flaggedReason: null,
    });
    if ('error' in result) return { error: result.error };
  }

  redirect('/dashboard/bookings');
}
