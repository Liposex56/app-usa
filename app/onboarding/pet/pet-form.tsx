'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  Fieldset,
  OnboardingHeading,
  Steps,
} from '@/components/onboarding/steps';
import { Button } from '@/components/ui/button';
import {
  CheckboxCard,
  Field,
  FormError,
  FormNote,
  Input,
  Select,
  Textarea,
} from '@/components/ui/field';
import type { PetRow } from '@/lib/database.types';

import { savePetAction, updatePetAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : label}
    </Button>
  );
}

/** Yes / No / Unsure — used for the "gets along with" fields. */
function TriState({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: boolean | null | undefined;
}) {
  const current =
    defaultValue === true ? 'yes' : defaultValue === false ? 'no' : 'unsure';
  return (
    <div className="rounded-xl border border-espresso-700/12 bg-white p-3.5">
      <p className="text-sm font-medium text-espresso-700">{label}</p>
      <div className="mt-2 flex gap-4">
        {(['yes', 'no', 'unsure'] as const).map((value) => (
          <label
            key={value}
            className="flex items-center gap-1.5 text-sm capitalize text-espresso-600"
          >
            <input
              type="radio"
              name={name}
              value={value}
              defaultChecked={current === value}
              className="accent-gold-500"
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

export function PetForm({
  isHavener,
  hideSteps = false,
  existing = null,
}: {
  isHavener: boolean;
  hideSteps?: boolean;
  existing?: PetRow | null;
}) {
  const isEdit = Boolean(existing);
  const action = isEdit ? updatePetAction : savePetAction;
  const [state, formAction] = useActionState(action, INITIAL);
  const [species, setSpecies] = useState<'dog' | 'cat'>(
    existing?.species ?? 'dog'
  );

  return (
    <div>
      {!hideSteps && (
        <Steps
          current="pet"
          sequence={
            isHavener
              ? ['role', 'owner_profile', 'pet', 'havener']
              : ['role', 'owner_profile', 'pet']
          }
        />
      )}

      <OnboardingHeading
        title={isEdit ? `Edit ${existing?.name}` : 'Tell us about your pet'}
        description="The more honest this is, the better your matches. A Havener who knows your dog is reactive on leash can prepare for it — one who finds out on day two cannot."
      />

      <form action={formAction} className="space-y-6">
        <FormError message={state.error} />
        {isEdit && <input type="hidden" name="petId" value={existing!.id} />}

        {/* ------------------------------------------------------- Basics */}
        <Fieldset legend="The basics">
          <fieldset className="space-y-2.5">
            <legend className="mb-2.5 block text-sm font-medium text-espresso-700">
              Dog or cat? <span className="text-gold-600">*</span>
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-espresso-700/12 bg-white p-3.5 transition-colors hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
                htmlFor="species-dog"
              >
                <input
                  id="species-dog"
                  type="radio"
                  name="species"
                  value="dog"
                  defaultChecked={species === 'dog'}
                  required
                  onChange={() => setSpecies('dog')}
                  style={{ width: '1.05rem', height: '1.05rem' }}
                  className="accent-gold-500"
                />
                <span className="text-sm font-medium text-espresso-700">Dog</span>
              </label>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-espresso-700/12 bg-white p-3.5 transition-colors hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
                htmlFor="species-cat"
              >
                <input
                  id="species-cat"
                  type="radio"
                  name="species"
                  value="cat"
                  defaultChecked={species === 'cat'}
                  onChange={() => setSpecies('cat')}
                  style={{ width: '1.05rem', height: '1.05rem' }}
                  className="accent-gold-500"
                />
                <span className="text-sm font-medium text-espresso-700">Cat</span>
              </label>
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                required
                placeholder="Luna"
                defaultValue={existing?.name ?? ''}
              />
            </Field>
            <Field label="Breed" htmlFor="breed">
              <Input
                id="breed"
                name="breed"
                placeholder={species === 'dog' ? 'Dachshund' : 'Domestic shorthair'}
                defaultValue={existing?.breed ?? ''}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Birthday" htmlFor="birthdate" hint="Approximate is fine.">
              <Input
                id="birthdate"
                name="birthdate"
                type="date"
                defaultValue={existing?.birthdate ?? ''}
              />
            </Field>
            <Field label="Sex" htmlFor="sex">
              <Select id="sex" name="sex" defaultValue={existing?.sex ?? ''}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </Select>
            </Field>
            <Field label="Weight (lb)" htmlFor="weightLb">
              <Input
                id="weightLb"
                name="weightLb"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                defaultValue={existing?.weight_lb ?? ''}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Size" htmlFor="size">
              <Select id="size" name="size" defaultValue={existing?.size ?? ''}>
                <option value="">Select…</option>
                <option value="small">Small — up to 25 lb</option>
                <option value="medium">Medium — 26 to 60 lb</option>
                <option value="large">Large — 61 to 100 lb</option>
                <option value="giant">Giant — over 100 lb</option>
              </Select>
            </Field>
            <Field label="Energy level" htmlFor="energyLevel">
              <Select
                id="energyLevel"
                name="energyLevel"
                defaultValue={existing?.energy_level ?? ''}
              >
                <option value="">Select…</option>
                <option value="low">Low — happy to nap</option>
                <option value="moderate">Moderate — a walk and they’re set</option>
                <option value="high">High — needs a real outlet daily</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="isFixed"
              label="Spayed or neutered"
              defaultChecked={existing?.is_fixed ?? false}
            />
            <CheckboxCard
              name="isInHeat"
              label="Currently in heat"
              description="Some Haveners can’t take pets in heat."
              defaultChecked={existing?.is_in_heat ?? false}
            />
          </div>
        </Fieldset>

        {/* ------------------------------------------------------- Health */}
        <Fieldset
          legend="Health"
          hint="Vaccination records are required before your first booking. You can upload the document from your dashboard."
        >
          <Field label="Vaccinations valid through" htmlFor="vaccinatedThrough">
            <Input
              id="vaccinatedThrough"
              name="vaccinatedThrough"
              type="date"
              defaultValue={existing?.vaccinated_through ?? ''}
            />
          </Field>

          <Field label="Allergies" htmlFor="allergies">
            <Input
              id="allergies"
              name="allergies"
              placeholder="Chicken, grass"
              defaultValue={existing?.allergies ?? ''}
            />
          </Field>

          <Field label="Medical conditions" htmlFor="medicalConditions">
            <Textarea
              id="medicalConditions"
              name="medicalConditions"
              placeholder="Hip dysplasia, mild epilepsy…"
              defaultValue={existing?.medical_conditions ?? ''}
            />
          </Field>

          <Field
            label="Medications"
            htmlFor="medications"
            hint="Name, dose and timing. Not every Havener is comfortable giving medication — we’ll filter for you."
          >
            <Textarea
              id="medications"
              name="medications"
              placeholder="Apoquel 16mg, one tablet with breakfast"
              defaultValue={existing?.medications ?? ''}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Veterinarian" htmlFor="vetName">
              <Input
                id="vetName"
                name="vetName"
                defaultValue={existing?.vet_name ?? ''}
              />
            </Field>
            <Field label="Vet phone" htmlFor="vetPhone">
              <Input
                id="vetPhone"
                name="vetPhone"
                type="tel"
                defaultValue={existing?.vet_phone ?? ''}
              />
            </Field>
          </div>

          <Field
            label="Pet insurance provider"
            htmlFor="insuranceProvider"
            hint="Optional — shown on the Health tab of their profile."
          >
            <Input
              id="insuranceProvider"
              name="insuranceProvider"
              placeholder="Nationwide"
              defaultValue={existing?.insurance_provider ?? ''}
            />
          </Field>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="isMicrochipped"
              label="Microchipped"
              defaultChecked={existing?.is_microchipped ?? false}
            />
          </div>

          <Field
            label="Adopted or acquired on"
            htmlFor="adoptedAt"
            hint="Optional."
          >
            <Input
              id="adoptedAt"
              name="adoptedAt"
              type="date"
              defaultValue={existing?.adopted_at ?? ''}
            />
          </Field>
        </Fieldset>

        {/* ---------------------------------------------------- Feeding */}
        <Fieldset legend="Feeding">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Food" htmlFor="foodType">
              <Input
                id="foodType"
                name="foodType"
                placeholder="Purina Pro Plan, dry"
                defaultValue={existing?.food_type ?? ''}
              />
            </Field>
            <Field label="Schedule" htmlFor="feedingSchedule">
              <Input
                id="feedingSchedule"
                name="feedingSchedule"
                placeholder="7am and 6pm, 1 cup each"
                defaultValue={existing?.feeding_schedule ?? ''}
              />
            </Field>
          </div>
          <Field label="Anything else about meals?" htmlFor="feedingNotes">
            <Textarea
              id="feedingNotes"
              name="feedingNotes"
              placeholder="Eats slowly, needs to be separated from other dogs while eating…"
              defaultValue={existing?.feeding_notes ?? ''}
            />
          </Field>
        </Fieldset>

        {/* --------------------------------------------------- Behaviour */}
        <Fieldset
          legend="Behavior"
          hint="Nothing here disqualifies your pet. It just makes sure they go to someone equipped for them."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="houseTrained"
              label="House trained"
              defaultChecked={existing?.house_trained ?? false}
            />
            <CheckboxCard
              name="isCrateTrained"
              label="Crate trained"
              defaultChecked={existing?.is_crate_trained ?? false}
            />
            <CheckboxCard
              name="hasAnxiety"
              label="Gets anxious"
              description="Separation anxiety, noise, new places."
              defaultChecked={existing?.has_anxiety ?? false}
            />
            <CheckboxCard
              name="hasBitten"
              label="Has bitten or tried to"
              defaultChecked={existing?.has_bitten ?? false}
            />
            <CheckboxCard
              name="isReactive"
              label="Reactive"
              description="Barks or lunges at dogs, people or bikes."
              defaultChecked={existing?.is_reactive ?? false}
            />
            <CheckboxCard
              name="isEscapeRisk"
              label="Escape risk"
              description="Jumps fences, bolts through doors."
              defaultChecked={existing?.is_escape_risk ?? false}
            />
            <CheckboxCard
              name="guardsResources"
              label="Guards food or toys"
              defaultChecked={existing?.guards_resources ?? false}
            />
            <CheckboxCard
              name="requiresMuzzle"
              label="Needs a muzzle in some situations"
              defaultChecked={existing?.requires_muzzle ?? false}
            />
          </div>

          <Field
            label="Special instructions for potty breaks"
            htmlFor="pottyInstructions"
          >
            <Textarea
              id="pottyInstructions"
              name="pottyInstructions"
              placeholder="Goes out first thing in the morning and right before bed. Uses a pad on rainy days."
              defaultValue={existing?.potty_instructions ?? ''}
            />
          </Field>

          <Field
            label="How long can they be left alone?"
            htmlFor="aloneTimeHours"
          >
            <Select
              id="aloneTimeHours"
              name="aloneTimeHours"
              defaultValue={existing?.alone_time_hours ?? ''}
            >
              <option value="">Select…</option>
              <option value="0-1h">0–1 hours</option>
              <option value="1-4h">1–4 hours</option>
              <option value="4-8h">4–8 hours</option>
              <option value="8+h">8+ hours</option>
            </Select>
          </Field>

          <Field label="Anything a Havener should know?" htmlFor="behaviorNotes">
            <Textarea
              id="behaviorNotes"
              name="behaviorNotes"
              placeholder="Fine with everything except skateboards. Calms down within a minute if you keep walking."
              defaultValue={existing?.behavior_notes ?? ''}
            />
          </Field>
        </Fieldset>

        {/* ------------------------------------------------ Compatibility */}
        <Fieldset
          legend="Gets along with"
          hint="Pick “Unsure” if you honestly don’t know yet — that’s more useful to a Havener than a guess."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <TriState
              name="goodWithDogs"
              label="Other dogs"
              defaultValue={existing?.good_with_dogs}
            />
            <TriState
              name="goodWithCats"
              label="Cats"
              defaultValue={existing?.good_with_cats}
            />
            <TriState
              name="goodWithKids"
              label="Children"
              defaultValue={existing?.good_with_kids}
            />
            <TriState
              name="goodWithStrangers"
              label="New people"
              defaultValue={existing?.good_with_strangers}
            />
          </div>

          <Field label="Special needs" htmlFor="specialNeeds">
            <Textarea
              id="specialNeeds"
              name="specialNeeds"
              placeholder="Deaf — responds to hand signals. Needs help onto furniture."
              defaultValue={existing?.special_needs ?? ''}
            />
          </Field>
        </Fieldset>

        {/* -------------------------------------------------- Private notes */}
        <Fieldset legend="Private notes">
          <Field
            label="Only you and your confirmed Havener can read this"
            htmlFor="privateNotes"
            hint="Never shown on public profiles or in search results."
          >
            <Textarea
              id="privateNotes"
              name="privateNotes"
              placeholder="The spare key is with the neighbor in 4B. She hides under the bed when the vacuum runs."
              defaultValue={existing?.private_notes ?? ''}
            />
          </Field>
        </Fieldset>

        {!isEdit && (
          <FormNote>
            You can add more pets any time from your dashboard. Only the name
            and species are required to continue.
          </FormNote>
        )}

        <Submit label={isEdit ? 'Save changes' : 'Save and continue'} />
      </form>
    </div>
  );
}
