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

import { savePetAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Save and continue'}
    </Button>
  );
}

export function PetForm({
  isHavener,
  hideSteps = false,
}: {
  isHavener: boolean;
  hideSteps?: boolean;
}) {
  const [state, formAction] = useActionState(savePetAction, INITIAL);
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');

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
        title="Tell us about your pet"
        description="The more honest this is, the better your matches. A Havener who knows your dog is reactive on leash can prepare for it — one who finds out on day two cannot."
      />

      <form action={formAction} className="space-y-6">
        <FormError message={state.error} />

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
                  defaultChecked
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
              <Input id="name" name="name" required placeholder="Luna" />
            </Field>
            <Field label="Breed" htmlFor="breed">
              <Input
                id="breed"
                name="breed"
                placeholder={species === 'dog' ? 'Dachshund' : 'Domestic shorthair'}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Birthday" htmlFor="birthdate" hint="Approximate is fine.">
              <Input id="birthdate" name="birthdate" type="date" />
            </Field>
            <Field label="Sex" htmlFor="sex">
              <Select id="sex" name="sex" defaultValue="">
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
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Size" htmlFor="size">
              <Select id="size" name="size" defaultValue="">
                <option value="">Select…</option>
                <option value="small">Small — up to 25 lb</option>
                <option value="medium">Medium — 26 to 60 lb</option>
                <option value="large">Large — 61 to 100 lb</option>
                <option value="giant">Giant — over 100 lb</option>
              </Select>
            </Field>
            <Field label="Energy level" htmlFor="energyLevel">
              <Select id="energyLevel" name="energyLevel" defaultValue="">
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
            />
            <CheckboxCard
              name="isInHeat"
              label="Currently in heat"
              description="Some Haveners can’t take pets in heat."
            />
          </div>
        </Fieldset>

        {/* ------------------------------------------------------- Health */}
        <Fieldset
          legend="Health"
          hint="Vaccination records are required before your first booking. You can upload the document from your dashboard."
        >
          <Field
            label="Vaccinations valid through"
            htmlFor="vaccinatedThrough"
          >
            <Input
              id="vaccinatedThrough"
              name="vaccinatedThrough"
              type="date"
            />
          </Field>

          <Field label="Allergies" htmlFor="allergies">
            <Input id="allergies" name="allergies" placeholder="Chicken, grass" />
          </Field>

          <Field label="Medical conditions" htmlFor="medicalConditions">
            <Textarea
              id="medicalConditions"
              name="medicalConditions"
              placeholder="Hip dysplasia, mild epilepsy…"
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
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Veterinarian" htmlFor="vetName">
              <Input id="vetName" name="vetName" />
            </Field>
            <Field label="Vet phone" htmlFor="vetPhone">
              <Input id="vetPhone" name="vetPhone" type="tel" />
            </Field>
          </div>
        </Fieldset>

        {/* ---------------------------------------------------- Feeding */}
        <Fieldset legend="Feeding">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Food" htmlFor="foodType">
              <Input
                id="foodType"
                name="foodType"
                placeholder="Purina Pro Plan, dry"
              />
            </Field>
            <Field label="Schedule" htmlFor="feedingSchedule">
              <Input
                id="feedingSchedule"
                name="feedingSchedule"
                placeholder="7am and 6pm, 1 cup each"
              />
            </Field>
          </div>
          <Field label="Anything else about meals?" htmlFor="feedingNotes">
            <Textarea
              id="feedingNotes"
              name="feedingNotes"
              placeholder="Eats slowly, needs to be separated from other dogs while eating…"
            />
          </Field>
        </Fieldset>

        {/* --------------------------------------------------- Behaviour */}
        <Fieldset
          legend="Behavior"
          hint="Nothing here disqualifies your pet. It just makes sure they go to someone equipped for them."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard name="isCrateTrained" label="Crate trained" />
            <CheckboxCard name="hasAnxiety" label="Gets anxious" description="Separation anxiety, noise, new places." />
            <CheckboxCard name="hasBitten" label="Has bitten or tried to" />
            <CheckboxCard name="isReactive" label="Reactive" description="Barks or lunges at dogs, people or bikes." />
            <CheckboxCard name="isEscapeRisk" label="Escape risk" description="Jumps fences, bolts through doors." />
            <CheckboxCard name="guardsResources" label="Guards food or toys" />
            <CheckboxCard name="requiresMuzzle" label="Needs a muzzle in some situations" />
          </div>

          <Field label="Anything a Havener should know?" htmlFor="behaviorNotes">
            <Textarea
              id="behaviorNotes"
              name="behaviorNotes"
              placeholder="Fine with everything except skateboards. Calms down within a minute if you keep walking."
            />
          </Field>
        </Fieldset>

        {/* ------------------------------------------------ Compatibility */}
        <Fieldset legend="Gets along with">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard name="goodWithDogs" label="Other dogs" />
            <CheckboxCard name="goodWithCats" label="Cats" />
            <CheckboxCard name="goodWithKids" label="Children" />
            <CheckboxCard name="goodWithStrangers" label="New people" />
          </div>

          <Field label="Special needs" htmlFor="specialNeeds">
            <Textarea
              id="specialNeeds"
              name="specialNeeds"
              placeholder="Deaf — responds to hand signals. Needs help onto furniture."
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
            />
          </Field>
        </Fieldset>

        <FormNote>
          You can add more pets any time from your dashboard. Only the name and
          species are required to continue.
        </FormNote>

        <Submit />
      </form>
    </div>
  );
}
