'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type {
  AloneTimeHours,
  EnergyLevel,
  HomeType,
  PetSize,
  Skill,
} from '@/lib/database.types';
import { geocode } from '@/lib/places';
import { createClient } from '@/lib/supabase/server';
import { bool, list, num, parseWholeDollarsToCents, text, triState } from '@/lib/utils';

export type ActionState = { error: string | null };

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { supabase, userId: user.id };
}

/* -------------------------------------------------------------------------- */
/* Step 1 — role                                                              */
/* -------------------------------------------------------------------------- */

export async function selectRoleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const role = text(formData, 'role');
  if (role !== 'owner' && role !== 'havener') {
    return { error: 'Please choose how you’ll use Havenr.' };
  }

  const { supabase, userId } = await currentUserId();

  // `as any`: supabase-js's generated Update overload collapses to `never`
  // for this table on the currently installed client version — a known
  // type-inference gap, not a real type hole (RLS still enforces access).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({
      is_owner: role === 'owner',
      is_havener: role === 'havener',
      onboarding_step: 'owner_profile',
    })
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/onboarding');
  redirect('/onboarding/owner');
}

/* -------------------------------------------------------------------------- */
/* Step 2 — contact details                                                   */
/* -------------------------------------------------------------------------- */

export async function saveOwnerProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await currentUserId();

  const firstName = text(formData, 'firstName');
  const lastName = text(formData, 'lastName');
  if (!firstName || !lastName) {
    return { error: 'Please enter your first and last name.' };
  }
  if (!text(formData, 'phone')) return { error: 'Please enter your mobile number.' };
  if (!text(formData, 'addressLine1') || !text(formData, 'city') || !text(formData, 'state')) {
    return { error: 'Please choose your address from the suggestions.' };
  }
  const latitude = num(formData, 'latitude');
  const longitude = num(formData, 'longitude');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_havener, is_owner')
    .eq('id', userId)
    .single();

  // Owners describe a pet next; Havener-only accounts skip straight ahead.
  const nextStep = profile?.is_owner ? 'pet' : 'havener';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: text(formData, 'displayName') ?? `${firstName} ${lastName}`,
      phone: text(formData, 'phone'),
      address_line1: text(formData, 'addressLine1'),
      address_line2: text(formData, 'addressLine2'),
      city: text(formData, 'city'),
      state: text(formData, 'state'),
      postal_code: text(formData, 'postalCode'),
      country: 'US',
      ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      emergency_contact_name: text(formData, 'emergencyName'),
      emergency_contact_phone: text(formData, 'emergencyPhone'),
      marketing_opt_in: bool(formData, 'marketingOptIn'),
      onboarding_step: nextStep,
    })
    .eq('id', userId);

  if (error) return { error: error.message };

  revalidatePath('/onboarding');
  redirect(nextStep === 'pet' ? '/onboarding/pet' : '/onboarding/havener');
}

/* -------------------------------------------------------------------------- */
/* Step 3 — first pet                                                         */
/* -------------------------------------------------------------------------- */

export async function savePetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await currentUserId();

  const name = text(formData, 'name');
  const species = text(formData, 'species');
  if (!name) return { error: 'Please tell us your pet’s name.' };
  if (species !== 'dog' && species !== 'cat') {
    return { error: 'Please choose whether this is a dog or a cat.' };
  }

  const sex = text(formData, 'sex');
  const size = text(formData, 'size');
  const energy = text(formData, 'energyLevel');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('pets') as any).insert({
    owner_id: userId,
    name,
    species,
    breed: text(formData, 'breed'),
    birthdate: text(formData, 'birthdate'),
    sex: sex === 'male' || sex === 'female' ? sex : null,
    weight_lb: num(formData, 'weightLb'),
    size: (size as PetSize | null) ?? null,
    energy_level: (energy as EnergyLevel | null) ?? null,

    is_fixed: bool(formData, 'isFixed'),
    is_in_heat: bool(formData, 'isInHeat'),
    vaccinated_through: text(formData, 'vaccinatedThrough'),
    allergies: text(formData, 'allergies'),
    medical_conditions: text(formData, 'medicalConditions'),
    medications: text(formData, 'medications'),
    vet_name: text(formData, 'vetName'),
    vet_phone: text(formData, 'vetPhone'),

    food_type: text(formData, 'foodType'),
    feeding_schedule: text(formData, 'feedingSchedule'),
    feeding_notes: text(formData, 'feedingNotes'),

    is_crate_trained: bool(formData, 'isCrateTrained'),
    has_anxiety: bool(formData, 'hasAnxiety'),
    has_bitten: bool(formData, 'hasBitten'),
    is_reactive: bool(formData, 'isReactive'),
    is_escape_risk: bool(formData, 'isEscapeRisk'),
    guards_resources: bool(formData, 'guardsResources'),
    requires_muzzle: bool(formData, 'requiresMuzzle'),
    behavior_notes: text(formData, 'behaviorNotes'),

    good_with_dogs: triState(formData, 'goodWithDogs'),
    good_with_cats: triState(formData, 'goodWithCats'),
    good_with_kids: triState(formData, 'goodWithKids'),
    good_with_strangers: triState(formData, 'goodWithStrangers'),

    house_trained: bool(formData, 'houseTrained'),
    potty_instructions: text(formData, 'pottyInstructions'),
    alone_time_hours: text(formData, 'aloneTimeHours') as AloneTimeHours | null,
    is_microchipped: bool(formData, 'isMicrochipped'),
    adopted_at: text(formData, 'adoptedAt'),
    insurance_provider: text(formData, 'insuranceProvider'),

    special_needs: text(formData, 'specialNeeds'),
    private_notes: text(formData, 'privateNotes'),
  });

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_havener, onboarding_step')
    .eq('id', userId)
    .single();

  revalidatePath('/dashboard');

  // Adding a second pet later must not rewind onboarding.
  const isHavener = profile?.is_havener ?? false;
  if (profile?.onboarding_step !== 'pet') {
    const returnTo = text(formData, 'returnTo');
    redirect(returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard');
  }

  const nextStep = isHavener ? 'havener' : 'done';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({
      onboarding_step: nextStep,
      ...(nextStep === 'done'
        ? { onboarding_completed_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', userId);

  redirect(nextStep === 'havener' ? '/onboarding/havener' : '/dashboard?welcome=1');
}

export async function updatePetAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await currentUserId();

  const petId = text(formData, 'petId');
  if (!petId) return { error: 'Missing pet.' };

  const name = text(formData, 'name');
  const species = text(formData, 'species');
  if (!name) return { error: 'Please tell us your pet’s name.' };
  if (species !== 'dog' && species !== 'cat') {
    return { error: 'Please choose whether this is a dog or a cat.' };
  }

  const sex = text(formData, 'sex');
  const size = text(formData, 'size');
  const energy = text(formData, 'energyLevel');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('pets') as any)
    .update({
      name,
      species,
      breed: text(formData, 'breed'),
      birthdate: text(formData, 'birthdate'),
      sex: sex === 'male' || sex === 'female' ? sex : null,
      weight_lb: num(formData, 'weightLb'),
      size: (size as PetSize | null) ?? null,
      energy_level: (energy as EnergyLevel | null) ?? null,

      is_fixed: bool(formData, 'isFixed'),
      is_in_heat: bool(formData, 'isInHeat'),
      vaccinated_through: text(formData, 'vaccinatedThrough'),
      allergies: text(formData, 'allergies'),
      medical_conditions: text(formData, 'medicalConditions'),
      medications: text(formData, 'medications'),
      vet_name: text(formData, 'vetName'),
      vet_phone: text(formData, 'vetPhone'),

      food_type: text(formData, 'foodType'),
      feeding_schedule: text(formData, 'feedingSchedule'),
      feeding_notes: text(formData, 'feedingNotes'),

      is_crate_trained: bool(formData, 'isCrateTrained'),
      has_anxiety: bool(formData, 'hasAnxiety'),
      has_bitten: bool(formData, 'hasBitten'),
      is_reactive: bool(formData, 'isReactive'),
      is_escape_risk: bool(formData, 'isEscapeRisk'),
      guards_resources: bool(formData, 'guardsResources'),
      requires_muzzle: bool(formData, 'requiresMuzzle'),
      behavior_notes: text(formData, 'behaviorNotes'),

      good_with_dogs: triState(formData, 'goodWithDogs'),
      good_with_cats: triState(formData, 'goodWithCats'),
      good_with_kids: triState(formData, 'goodWithKids'),
      good_with_strangers: triState(formData, 'goodWithStrangers'),

      house_trained: bool(formData, 'houseTrained'),
      potty_instructions: text(formData, 'pottyInstructions'),
      alone_time_hours: text(formData, 'aloneTimeHours') as AloneTimeHours | null,
      is_microchipped: bool(formData, 'isMicrochipped'),
      adopted_at: text(formData, 'adoptedAt'),
      insurance_provider: text(formData, 'insuranceProvider'),

      special_needs: text(formData, 'specialNeeds'),
      private_notes: text(formData, 'privateNotes'),
    })
    .eq('id', petId)
    .eq('owner_id', userId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pets');
  revalidatePath(`/dashboard/pets/${petId}`);
  redirect(`/dashboard/pets/${petId}`);
}

/* -------------------------------------------------------------------------- */
/* Step 4 — Havener profile + services                                        */
/* -------------------------------------------------------------------------- */

const SERVICE_TYPES = [
  'boarding',
  'daycare',
  'house_sitting',
  'dog_walking',
  'drop_in_visit',
] as const;

export async function saveHavenerProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, userId } = await currentUserId();

  const selectedServices = list(formData, 'services').filter(
    (s): s is (typeof SERVICE_TYPES)[number] =>
      (SERVICE_TYPES as readonly string[]).includes(s)
  );

  if (selectedServices.length === 0) {
    return { error: 'Choose at least one service you want to offer.' };
  }

  const city = text(formData, 'serviceCity');
  const state = text(formData, 'serviceState');
  if (!city || !state) {
    return { error: 'Please tell us the city and state you work in.' };
  }

  const homeType = text(formData, 'homeType');
  const acceptedSizes = list(formData, 'acceptedSizes') as PetSize[];
  const skills = list(formData, 'skills') as Skill[];

  const submitForReview = formData.get('intent') === 'submit';

  const yardType = text(formData, 'yardType');
  const kids05 = bool(formData, 'hasKids05');
  const kids612 = bool(formData, 'hasKids612');
  const dogsAtHome = bool(formData, 'hasDogsAtHome');
  const catsAtHome = bool(formData, 'hasCatsAtHome');
  const cagedPets = bool(formData, 'hasCagedPets');
  const unneutered = bool(formData, 'acceptsUnneuteredMales');
  const unspayed = bool(formData, 'acceptsUnspayedFemales');
  const acceptsDogs = bool(formData, 'acceptsDogs');
  const acceptsCats = bool(formData, 'acceptsCats');
  const policy = text(formData, 'cancellationPolicy');
  const servicePolicy = (
    ['same_day', 'one_day', 'three_day', 'seven_day'] as const
  ).find((value) => value === policy);

  // A profile sent for review has to be complete: an empty one is no use to
  // owners. ("Save and finish later" skips this.)
  if (submitForReview) {
    const homeAnswered =
      kids05 || kids612 || dogsAtHome || catsAtHome || cagedPets ||
      bool(formData, 'dogsOnFurniture') || bool(formData, 'dogsOnBed') ||
      bool(formData, 'allowsSmoking') || bool(formData, 'homeNone');
    const hostAnswered =
      bool(formData, 'hostsMultipleFamilies') || bool(formData, 'acceptsPuppies') ||
      bool(formData, 'acceptsNotCrateTrained') || unneutered || unspayed ||
      bool(formData, 'acceptsInHeat') || bool(formData, 'hostNone');
    const missing = [
      !text(formData, 'headline') && 'a headline',
      !text(formData, 'bio') && 'the "About you" text',
      !text(formData, 'routineDescription') && 'what a day of care looks like',
      num(formData, 'yearsExperience') == null && 'your years of experience',
      !text(formData, 'scheduleDescription') && 'your schedule',
      !text(formData, 'homeEnvironmentDescription') && 'safety, trust and environment',
      !text(formData, 'petCareNotes') && 'what you need to know about pets ahead of time',
      !homeType && 'your home type',
      !yardType && 'your type of yard',
      !text(formData, 'homeFullTime') && 'whether you are home full-time',
      !homeAnswered && 'what owners can expect at your home (or "None of the above")',
      !acceptsDogs && !acceptsCats && 'whether you take dogs, cats or both',
      acceptsDogs && acceptedSizes.length === 0 && 'the sizes of dog you accept',
      !hostAnswered && 'what you are able to host (or "None of the above")',
      !servicePolicy && 'a cancellation policy',
      acceptsCats && !text(formData, 'catBio') && 'your experience with cats',
    ].filter(Boolean);
    if (missing.length > 0) {
      return { error: `Please complete: ${missing.join('; ')}.` };
    }
  }

  // Pin the Havener on the map from their city/zip so search can measure how
  // far they are from an owner. If the lookup finds nothing the old pin stays.
  const where = await geocode(
    [city, state, text(formData, 'servicePostalCode')].filter(Boolean).join(', ')
  );

  const boardingSpaces = num(formData, 'maxBoardingPets');
  const daycareSpaces = num(formData, 'maxDaycarePets');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase.from('sitter_profiles') as any)
    .upsert(
      {
        id: userId,
        headline: text(formData, 'headline'),
        bio: text(formData, 'bio'),
        routine_description: text(formData, 'routineDescription'),
        schedule_description: text(formData, 'scheduleDescription'),
        home_environment_description: text(formData, 'homeEnvironmentDescription'),
        pet_care_notes: text(formData, 'petCareNotes'),
        skills,
        cat_bio: text(formData, 'catBio'),
        cat_years_experience: num(formData, 'catYearsExperience'),
        years_experience: num(formData, 'yearsExperience'),

        service_city: city,
        service_state: state,
        service_postal_code: text(formData, 'servicePostalCode'),
        ...(where ? { latitude: where.lat, longitude: where.lng } : {}),
        service_radius_miles: num(formData, 'serviceRadiusMiles') ?? 10,
        provides_transport: bool(formData, 'providesTransport'),

        home_type: homeType as HomeType | null,
        has_yard: yardType === 'fenced' || yardType === 'unfenced',
        yard_is_fenced: yardType === 'fenced',
        home_full_time: text(formData, 'homeFullTime') === 'yes',
        works_outside_home: text(formData, 'homeFullTime') === 'no',
        has_kids_0_5: kids05,
        has_kids_6_12: kids612,
        has_kids_at_home: kids05 || kids612,
        has_dogs_at_home: dogsAtHome,
        has_cats_at_home: catsAtHome,
        has_caged_pets: cagedPets,
        has_own_pets: dogsAtHome || catsAtHome || cagedPets,
        own_pets_description: text(formData, 'ownPetsDescription'),
        dogs_on_furniture: bool(formData, 'dogsOnFurniture'),
        dogs_on_bed: bool(formData, 'dogsOnBed'),
        allows_smoking: bool(formData, 'allowsSmoking'),
        max_pets_per_day: Math.max(boardingSpaces ?? 0, daycareSpaces ?? 0) || 2,

        accepts_dogs: acceptsDogs,
        accepts_cats: acceptsCats,
        accepted_sizes: acceptedSizes.length ? acceptedSizes : ['small', 'medium'],
        hosts_multiple_families: bool(formData, 'hostsMultipleFamilies'),
        accepts_puppies: bool(formData, 'acceptsPuppies'),
        accepts_not_crate_trained: bool(formData, 'acceptsNotCrateTrained'),
        accepts_unneutered_males: unneutered,
        accepts_unspayed_females: unspayed,
        accepts_unfixed: unneutered || unspayed,
        accepts_in_heat: bool(formData, 'acceptsInHeat'),
        // No longer asked: every energy level and senior pets are welcome.
        accepts_seniors: true,
        accepted_energy_levels: ['low', 'moderate', 'high'],

        calendar_updated_at: new Date().toISOString(),
        ...(submitForReview
          ? { status: 'pending_review' as const, submitted_at: new Date().toISOString() }
          : {}),
      },
      { onConflict: 'id' }
    );

  if (profileError) return { error: profileError.message };

  // Replace the service rows with exactly what was submitted.
  const { error: deleteError } = await supabase
    .from('sitter_services')
    .delete()
    .eq('sitter_id', userId);

  if (deleteError) return { error: deleteError.message };

  const rows = selectedServices.map((serviceType) => ({
    sitter_id: userId,
    service_type: serviceType,
    is_active: true,
    base_rate_cents: parseWholeDollarsToCents(formData.get(`rate_${serviceType}`)) ?? 0,
    additional_pet_rate_cents:
      parseWholeDollarsToCents(formData.get(`extraPet_${serviceType}`)) ?? 0,
    accepts_dogs: bool(formData, `dogs_${serviceType}`),
    accepts_cats: bool(formData, `cats_${serviceType}`),
    cancellation_policy: servicePolicy ?? 'three_day',
  }));

  const missingRate = rows.find((row) => row.base_rate_cents <= 0);
  if (missingRate) {
    return {
      error: `Please set a rate for ${missingRate.service_type.replace(/_/g, ' ')}.`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: servicesError } = await (supabase.from('sitter_services') as any)
    .insert(rows);

  if (servicesError) return { error: servicesError.message };

  // Spaces per service: pets per night for boarding, pets per day for daycare.
  const capacity = [
    selectedServices.includes('boarding') && boardingSpaces != null
      ? { sitter_id: userId, service_type: 'boarding', spaces: boardingSpaces }
      : null,
    selectedServices.includes('daycare') && daycareSpaces != null
      ? { sitter_id: userId, service_type: 'daycare', spaces: daycareSpaces }
      : null,
  ].filter(Boolean);
  if (capacity.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sitter_service_capacity') as any).upsert(capacity, {
      onConflict: 'sitter_id,service_type',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({
      onboarding_step: 'done',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  revalidatePath('/dashboard');
  // Straight to the background check once the profile is sent for review.
  redirect(submitForReview ? '/dashboard/havener/verification?submitted=1' : '/dashboard?welcome=1');
}
