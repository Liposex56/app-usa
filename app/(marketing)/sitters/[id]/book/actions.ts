'use server';

import { redirect } from 'next/navigation';

import type { PlatformSettingsRow, ServiceType, SitterServiceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { commissionPercentFromSettings, computeFeeSplit } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';
import { list, num, text } from '@/lib/utils';

export type BookingActionState = { error: string | null };

export async function requestBookingAction(
  sitterId: string,
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const serviceType = text(formData, 'serviceType') as ServiceType | null;
  const startDate = text(formData, 'startDate');
  const endDate = text(formData, 'endDate');
  const petIds = list(formData, 'petIds');
  const notes = text(formData, 'notes');
  const additionalPets = Math.max(0, (num(formData, 'additionalPets') ?? 0));

  if (!serviceType) return { error: 'Please choose a service.' };
  if (!startDate) return { error: 'Please choose a date.' };
  if (petIds.length === 0) return { error: 'Please select at least one pet.' };

  // Confirm every selected pet actually belongs to this owner — the RLS
  // policy on booking_pets would reject it anyway, but a clear message here
  // is friendlier than a generic database error.
  const { data: ownedPets } = await supabase
    .from('pets')
    .select('id')
    .eq('owner_id', profile.id)
    .in('id', petIds);
  if (!ownedPets || ownedPets.length !== petIds.length) {
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
  if (!service) {
    return { error: 'This Havener no longer offers that service.' };
  }

  const { data: settingsRow } = await supabase
    .from('platform_settings')
    .select('company_commission_percent')
    .eq('id', 1)
    .maybeSingle();
  const commissionPercent = commissionPercentFromSettings(
    settingsRow as Pick<PlatformSettingsRow, 'company_commission_percent'> | null
  );

  const extraPetCount = Math.max(0, petIds.length - 1 + additionalPets);
  const baseCents = service.base_rate_cents;
  const extraFeesCents = extraPetCount * service.additional_pet_rate_cents;
  const totalCents = baseCents + extraFeesCents;
  const split = computeFeeSplit(totalCents, commissionPercent);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking, error } = await (supabase.from('bookings') as any)
    .insert({
      owner_id: profile.id,
      sitter_id: sitterId,
      service_type: serviceType,
      status: 'requested',
      start_date: startDate,
      end_date: endDate || null,
      owner_notes: notes,
      base_rate_cents: baseCents,
      additional_pet_rate_cents: service.additional_pet_rate_cents,
      extra_fees_cents: extraFeesCents,
      commission_percent: commissionPercent,
      platform_fee_cents: split.companyFeeCents,
      sitter_payout_cents: split.sitterPayoutCents,
      total_cents: totalCents,
    })
    .select('id')
    .single();

  if (error || !booking) {
    return { error: error?.message ?? 'Could not create the request.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: petsError } = await (supabase.from('booking_pets') as any).insert(
    petIds.map((petId) => ({ booking_id: booking.id, pet_id: petId }))
  );
  if (petsError) {
    return { error: petsError.message };
  }

  redirect(`/dashboard/bookings/${booking.id}`);
}
