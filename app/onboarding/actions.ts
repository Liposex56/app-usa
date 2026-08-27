'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { EnergyLevel, HomeType, PetSize, Skill } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { bool, list, num, parseDollarsToCents, text } from '@/lib/utils';

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
  if (role !== 'owner' && role !== 'havener' && role !== 'both') {
    return { error: 'Please choose how you’ll use Havenr.' };
  }

  const { supabase, userId } = await currentUserId();

  // `as any`: supabase-js's generated Update overload collapses to `never`
  // for this table on the currently installed client version — a known
  // type-inference gap, not a real type hole (RLS still enforces access).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('profiles') as any)
    .update({
      is_owner: role === 'owner' || role === 'both',
      is_havener: role === 'havener' || role === 'both',
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

    good_with_dogs: bool(formData, 'goodWithDogs'),
    good_with_cats: bool(formData, 'goodWithCats'),
    good_with_kids: bool(formData, 'goodWithKids'),
    good_with_strangers: bool(formData, 'goodWithStrangers'),

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
    redirect('/dashboard');
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
  const acceptedEnergy = list(formData, 'acceptedEnergyLevels') as EnergyLevel[];
  const skills = list(formData, 'skills') as Skill[];

  const submitForReview = formData.get('intent') === 'submit';

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
        service_radius_miles: num(formData, 'serviceRadiusMiles') ?? 10,
        provides_transport: bool(formData, 'providesTransport'),

        home_type: homeType as HomeType | null,
        has_yard: bool(formData, 'hasYard'),
        yard_is_fenced: bool(formData, 'yardIsFenced'),
        has_kids_at_home: bool(formData, 'hasKidsAtHome'),
        has_own_pets: bool(formData, 'hasOwnPets'),
        own_pets_description: text(formData, 'ownPetsDescription'),
        works_outside_home: bool(formData, 'worksOutsideHome'),
        provides_daily_exercise: bool(formData, 'providesDailyExercise'),
        has_stairs: bool(formData, 'hasStairs'),
        max_pets_per_day: num(formData, 'maxPetsPerDay') ?? 2,

        accepts_dogs: bool(formData, 'acceptsDogs'),
        accepts_cats: bool(formData, 'acceptsCats'),
        accepted_sizes: acceptedSizes.length ? acceptedSizes : ['small', 'medium'],
        accepts_puppies: bool(formData, 'acceptsPuppies'),
        accepts_seniors: bool(formData, 'acceptsSeniors'),
        accepted_energy_levels: acceptedEnergy.length
          ? acceptedEnergy
          : ['low', 'moderate'],
        accepts_unfixed: bool(formData, 'acceptsUnfixed'),
        accepts_in_heat: bool(formData, 'acceptsInHeat'),
        comfortable_with_meds: bool(formData, 'comfortableWithMeds'),
        comfortable_with_anxiety: bool(formData, 'comfortableWithAnxiety'),
        comfortable_with_reactive: bool(formData, 'comfortableWithReactive'),

        cancellation_policy: text(formData, 'cancellationPolicy') ?? 'moderate',
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
    base_rate_cents: parseDollarsToCents(formData.get(`rate_${serviceType}`)) ?? 0,
    additional_pet_rate_cents:
      parseDollarsToCents(formData.get(`extraPet_${serviceType}`)) ?? 0,
    accepts_dogs: bool(formData, `dogs_${serviceType}`),
    accepts_cats: bool(formData, `cats_${serviceType}`),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({
      onboarding_step: 'done',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  revalidatePath('/dashboard');
  redirect('/dashboard?welcome=1');
}
