'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type {
  DayOfWeek,
  PetSize,
  PottyBreakFrequency,
  ServiceCancellationPolicy,
  ServiceType,
} from '@/lib/database.types';
import { autoRatesAvailable, loadRateContext } from '@/lib/rate-context';
import { SERVICE_BY_TYPE } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { bool, list, num, parseWholeDollarsToCents, text } from '@/lib/utils';

export type ServiceSettingsState = { error: string | null };

const CANCELLATION_POLICIES: ServiceCancellationPolicy[] = [
  'same_day',
  'one_day',
  'three_day',
  'seven_day',
];

export async function saveServiceSettingsAction(
  _prev: ServiceSettingsState,
  formData: FormData
): Promise<ServiceSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const serviceType = text(formData, 'serviceType') as ServiceType | null;
  if (!serviceType) return { error: 'Invalid request.' };

  const cancellationPolicy = text(formData, 'cancellationPolicy');
  const safeCancellationPolicy = CANCELLATION_POLICIES.includes(
    cancellationPolicy as ServiceCancellationPolicy
  )
    ? (cancellationPolicy as ServiceCancellationPolicy)
    : 'three_day';

  // "Automatic rates" hands the holiday, extended-stay, puppy, additional-dog
  // and 60-minute rates to Havenr's rules — only once Havenr has set them.
  const autoRates = bool(formData, 'autoRates');
  if (autoRates && !autoRatesAvailable((await loadRateContext(supabase)).percents)) {
    return { error: 'Havenr hasn’t set the automatic rates yet — set these rates yourself for now.' };
  }
  // Walks and drop-in visits are priced by length; the rest are stays.
  const visit = serviceType === 'dog_walking' || serviceType === 'drop_in_visit';
  const baseRate = parseWholeDollarsToCents(formData.get('baseRate')) ?? 0;
  const typedExtended = parseWholeDollarsToCents(formData.get('extendedStayRate'));
  const extendedStayRate = typedExtended === baseRate ? null : typedExtended;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: serviceError } = await (supabase.from('sitter_services') as any)
    .upsert(
      {
        sitter_id: user.id,
        service_type: serviceType,
        is_active: bool(formData, 'isActive'),
        is_paused: bool(formData, 'isPaused'),
        accepts_new_customers: bool(formData, 'acceptsNewCustomers'),
        accepts_dogs: bool(formData, 'acceptsDogs'),
        accepts_cats: bool(formData, 'acceptsCats'),
        base_rate_cents: baseRate,
        auto_rates: autoRates,
        // With automatic rates on, these are Havenr's and are left as they were.
        // Holiday, extended-stay and puppy rates are for stays; the 60-minute
        // rate is for walks and visits.
        ...(autoRates
          ? {}
          : {
              additional_pet_rate_cents:
                parseWholeDollarsToCents(formData.get('additionalPetRate')) ?? 0,
              holiday_rate_cents: visit
                ? null
                : parseWholeDollarsToCents(formData.get('holidayRate')),
              // Left equal to the regular rate it means "same as regular" and
              // keeps following it; only a different number is stored.
              extended_stay_rate_cents: visit ? null : extendedStayRate,
              puppy_rate_cents: visit
                ? null
                : parseWholeDollarsToCents(formData.get('puppyRate')),
              sixty_minute_rate_cents: visit
                ? parseWholeDollarsToCents(formData.get('sixtyMinuteRate'))
                : null,
            }),
        extra_hour_rate_cents: parseWholeDollarsToCents(formData.get('extraHourRate')),
        bathing_rate_cents: parseWholeDollarsToCents(formData.get('bathingRate')),
        pickup_dropoff_rate_cents: parseWholeDollarsToCents(
          formData.get('pickupDropoffRate')
        ),
        cancellation_policy: safeCancellationPolicy,
      },
      { onConflict: 'sitter_id,service_type' }
    );

  if (serviceError) return { error: serviceError.message };

  const pottyBreakFrequency = text(
    formData,
    'pottyBreakFrequency'
  ) as PottyBreakFrequency | null;
  const availableDays = list(formData, 'availableDays') as DayOfWeek[];
  const acceptedSizes = list(formData, 'acceptedSizes') as PetSize[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase.from('sitter_profiles') as any)
    .update({
      home_full_time: text(formData, 'homeFullTime') !== 'no',
      available_days: availableDays.length
        ? availableDays
        : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      potty_break_frequency: pottyBreakFrequency,
      advance_notice_days: num(formData, 'advanceNoticeDays') ?? 0,
      accepts_extended_stays: bool(formData, 'acceptsExtendedStays'),
      home_type: text(formData, 'homeType'),
      has_yard: bool(formData, 'hasYard'),
      yard_is_fenced: bool(formData, 'yardIsFenced'),
      allows_smoking: bool(formData, 'allowsSmoking'),
      has_kids_at_home: bool(formData, 'hasKidsAtHome'),
      dogs_on_furniture: bool(formData, 'dogsOnFurniture'),
      dogs_on_bed: bool(formData, 'dogsOnBed'),
      has_own_pets: bool(formData, 'hasOwnPets'),
      hosts_multiple_families: bool(formData, 'hostsMultipleFamilies'),
      accepts_puppies: bool(formData, 'acceptsPuppies'),
      accepts_not_crate_trained: bool(formData, 'acceptsNotCrateTrained'),
      accepts_unfixed: bool(formData, 'acceptsUnfixed'),
      accepts_in_heat: bool(formData, 'acceptsInHeat'),
      max_pets_per_day: num(formData, 'maxPetsPerDay') ?? 2,
      accepted_sizes: acceptedSizes.length
        ? acceptedSizes
        : ['small', 'medium'],
    })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  revalidatePath('/dashboard/havener/services');
  revalidatePath(`/dashboard/havener/services/${SERVICE_BY_TYPE[serviceType].slug}`);
  return { error: null };
}
