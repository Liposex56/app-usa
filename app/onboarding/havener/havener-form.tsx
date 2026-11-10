'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  Fieldset,
  OnboardingHeading,
  Steps,
} from '@/components/onboarding/steps';
import { CancellationPoliciesHelp } from '@/components/cancellation-policies';
import { Button } from '@/components/ui/button';
import {
  CheckboxCard,
  Field,
  FormError,
  Input,
  RadioCard,
  Select,
  Textarea,
} from '@/components/ui/field';
import { SERVICES } from '@/lib/services';

import { saveHavenerProfileAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

function Submit({ intent, label }: { intent: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="intent"
      value={intent}
      size="lg"
      variant={intent === 'submit' ? 'primary' : 'secondary'}
      disabled={pending}
    >
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function HavenerForm({
  isOwner,
  hideSteps = false,
  defaults,
}: {
  isOwner: boolean;
  hideSteps?: boolean;
  /** The address from "Your details", so it isn't typed twice. */
  defaults?: { city: string | null; state: string | null; postalCode: string | null };
}) {
  const [state, formAction] = useActionState(saveHavenerProfileAction, INITIAL);
  const [selected, setSelected] = useState<string[]>(['boarding']);
  const [offersHomeCare, setOffersHomeCare] = useState(true);
  const [yardType, setYardType] = useState<'fenced' | 'unfenced' | 'none' | ''>('');

  function toggleService(type: string, checked: boolean) {
    const next = checked
      ? [...selected, type]
      : selected.filter((s) => s !== type);
    setSelected(next);
    setOffersHomeCare(next.includes('boarding') || next.includes('daycare'));
  }

  const sequence: Array<'role' | 'owner_profile' | 'pet' | 'havener'> = isOwner
    ? ['role', 'owner_profile', 'pet', 'havener']
    : ['role', 'owner_profile', 'havener'];

  return (
    <div>
      {!hideSteps && <Steps current="havener" sequence={sequence} />}

      <OnboardingHeading
        title="Build your Havener profile"
        description="This is what pet owners will see. Be specific about what you take and what you don’t — we only show you to people you actually match."
      />

      <form action={formAction} className="space-y-6">
        <FormError message={state.error} />

        {/* ------------------------------------------------------ Services */}
        <Fieldset
          legend="Services and rates"
          hint="Pick what you want to offer and set your own price. You can change these any time."
        >
          <div className="space-y-3">
            {SERVICES.map((service) => {
              const active = selected.includes(service.type);
              return (
                <div
                  key={service.type}
                  className="rounded-2xl border border-espresso-700/12 bg-bone p-4 transition-colors has-[:checked]:border-gold-500/60"
                >
                  <label
                    htmlFor={`service-${service.type}`}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <input
                      id={`service-${service.type}`}
                      type="checkbox"
                      name="services"
                      value={service.type}
                      checked={active}
                      onChange={(e) =>
                        toggleService(service.type, e.target.checked)
                      }
                      style={{ width: '1.05rem', height: '1.05rem' }}
                      className="mt-0.5 shrink-0 accent-gold-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-espresso-700">
                        {service.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-espresso-500/75">
                        {service.tagline}
                      </span>
                    </span>
                  </label>

                  {active && (
                    <div className="mt-4 grid gap-4 border-t border-espresso-700/8 pt-4 sm:grid-cols-2">
                      <Field
                        label={`Rate per ${service.rateUnit} (USD)`}
                        htmlFor={`rate_${service.type}`}
                        required
                      >
                        <Input
                          id={`rate_${service.type}`}
                          name={`rate_${service.type}`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="decimal"
                          placeholder={String(service.fromRate)}
                          required
                        />
                      </Field>
                      <Field
                        label="Additional pet (USD)"
                        htmlFor={`extraPet_${service.type}`}
                      >
                        <Input
                          id={`extraPet_${service.type}`}
                          name={`extraPet_${service.type}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="decimal"
                          placeholder="0"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <p className="mb-2 text-sm font-medium text-espresso-700">
                          For this service I take
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <CheckboxCard
                            name={`dogs_${service.type}`}
                            label="Dogs"
                            defaultChecked={service.species.includes('dog')}
                          />
                          <CheckboxCard
                            name={`cats_${service.type}`}
                            label="Cats"
                            defaultChecked={service.type === 'drop_in_visit'}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Fieldset>

        {/* --------------------------------------------------------- About */}
        <Fieldset legend="About you">
          <Field
            label="Headline"
            htmlFor="headline"
            required
            hint="One line that shows under your name in search results."
          >
            <Input
              id="headline"
              name="headline"
              required
              maxLength={90}
              placeholder="Fenced yard, no other pets, 10 years with senior dogs"
            />
          </Field>

          <Field label="About you" htmlFor="bio" required>
            <Textarea
              id="bio"
              name="bio"
              required
              placeholder="Who you are, why you do this, what kind of pets you’re best with."
            />
          </Field>

          <Field
            label="What a day of care looks like with you"
            htmlFor="routineDescription"
            required
            hint="This is the single most reassuring thing on your profile. Be concrete."
          >
            <Textarea
              id="routineDescription"
              name="routineDescription"
              required
              placeholder="Morning walk at 7, breakfast, backyard time, a nap in the living room, afternoon walk, dinner at 6, bed by 10."
            />
          </Field>

          <Field label="Years of experience" htmlFor="yearsExperience" required>
            <Input
              id="yearsExperience"
              name="yearsExperience"
              required
              type="number"
              min="0"
              max="60"
              inputMode="numeric"
            />
          </Field>
        </Fieldset>

        {/* --------------------------------------------------------- Skills */}
        <Fieldset
          legend="Skills"
          hint="Can you provide any of the following? Tick everything that applies."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="skills"
              value="first_aid_cpr"
              label="First aid and/or CPR"
            />
            <CheckboxCard
              name="skills"
              value="oral_medication"
              label="Oral medication administration"
            />
            <CheckboxCard
              name="skills"
              value="injectable_medication"
              label="Injectable medication administration"
            />
            <CheckboxCard name="skills" value="senior_care" label="Senior care" />
            <CheckboxCard
              name="skills"
              value="special_needs_care"
              label="Special needs care"
            />
            <CheckboxCard
              name="skills"
              value="daily_exercise_high_energy"
              label="Daily exercise for high-energy dogs"
            />
          </div>
        </Fieldset>

        {/* ------------------------------------------------- What to expect */}
        <Fieldset legend="What to expect">
          <Field
            label="Schedule"
            htmlFor="scheduleDescription"
            required
            hint="How does pet care fit into your daily or weekly routine?"
          >
            <Textarea id="scheduleDescription" name="scheduleDescription" required />
          </Field>
          <Field
            label="Safety, trust & environment"
            htmlFor="homeEnvironmentDescription"
            required
            hint="How do you care for pets in your home and/or your client’s home? This will vary depending on which service you offer."
          >
            <Textarea
              id="homeEnvironmentDescription"
              name="homeEnvironmentDescription"
              required
            />
          </Field>
          <Field
            label="Important to know about their pets ahead of time"
            htmlFor="petCareNotes"
            required
          >
            <Textarea id="petCareNotes" name="petCareNotes" required />
          </Field>
        </Fieldset>

        {/* ------------------------------------------------- Cat experience */}
        <Fieldset
          legend="Cat experience"
          hint="Fill this in if you care for cats — it is only shown to cat owners."
        >
          <Field label="Your experience with cats" htmlFor="catBio">
            <Textarea
              id="catBio"
              name="catBio"
              placeholder="I've taken care of cats of every kind since I was 10. Neighbors, friends, and family have relied on me to check in with, feed and play with their pets…"
            />
          </Field>
          <Field label="Years of experience with cats" htmlFor="catYearsExperience">
            <Input
              id="catYearsExperience"
              name="catYearsExperience"
              type="number"
              min="0"
              max="60"
              inputMode="numeric"
            />
          </Field>
        </Fieldset>

        {/* ------------------------------------------------------ Location */}
        <Fieldset
          legend="Where you work"
          hint="Filled in from the address you gave us. We show your city and approximate distance — your street address is never public."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" htmlFor="serviceCity" required>
              <Input id="serviceCity" name="serviceCity" defaultValue={defaults?.city ?? ''} required />
            </Field>
            <Field label="State" htmlFor="serviceState" required>
              <Input
                id="serviceState"
                name="serviceState"
                maxLength={2}
                placeholder="MA"
                defaultValue={defaults?.state ?? ''}
                required
              />
            </Field>
            <Field label="ZIP code" htmlFor="servicePostalCode" required>
              <Input
                id="servicePostalCode"
                name="servicePostalCode"
                inputMode="numeric"
                defaultValue={defaults?.postalCode ?? ''}
                required
              />
            </Field>
          </div>

          <Field
            label="How far will you travel? (miles)"
            htmlFor="serviceRadiusMiles"
          >
            <Input
              id="serviceRadiusMiles"
              name="serviceRadiusMiles"
              type="number"
              min="1"
              max="100"
              defaultValue={10}
              inputMode="numeric"
            />
          </Field>

          <CheckboxCard
            name="providesTransport"
            label="I can pick up and drop off"
            description="You can charge separately for this."
          />
        </Fieldset>

        {/* ---------------------------------------------------------- Home */}
        <Fieldset
          legend="Your home"
          hint="Honest answers here prevent bad matches. Owners see them on your profile."
        >
          <Field label="Home type" htmlFor="homeType" required>
            <Select id="homeType" name="homeType" defaultValue="" required>
              <option value="">Select…</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
            </Select>
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              What type of yard do you have? <span className="text-gold-600">*</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(
                [
                  ['fenced', 'Fenced yard'],
                  ['unfenced', 'Unfenced yard'],
                  ['none', 'No yard'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-hv-ink/15 bg-hv-paper p-3.5 text-[17px] font-semibold text-espresso-700 has-[:checked]:border-hv-ink has-[:checked]:bg-hv-butter"
                >
                  <input
                    type="radio"
                    name="yardType"
                    value={value}
                    required
                    checked={yardType === value}
                    onChange={() => setYardType(value)}
                    className="accent-[#26100B]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              Are you home full-time during the week? <span className="text-gold-600">*</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <RadioCard
                name="homeFullTime"
                value="yes"
                label="Yes"
                description="Someone is with the pets most of the day."
                required
              />
              <RadioCard
                name="homeFullTime"
                value="no"
                label="No"
                description="I work outside the home part of the week."
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              What can pet owners expect at your home? <span className="text-gold-600">*</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <CheckboxCard name="hasKids05" label="Children age 0-5" />
              <CheckboxCard name="hasKids612" label="Children age 6-12" />
              <CheckboxCard name="dogsOnFurniture" label="Dogs are allowed on furniture" />
              <CheckboxCard name="dogsOnBed" label="Dogs are allowed on bed" />
              <CheckboxCard name="hasDogsAtHome" label="Dogs in home" />
              <CheckboxCard name="hasCatsAtHome" label="Cats in home" />
              <CheckboxCard name="allowsSmoking" label="Smoking inside home" />
              <CheckboxCard name="hasCagedPets" label="Caged pets in home" />
              <CheckboxCard name="homeNone" label="None of the above" />
            </div>
          </div>

          <Field
            label="Tell us about your pets"
            htmlFor="ownPetsDescription"
            hint="If you have pets at home. Leave it empty if you don’t."
          >
            <Input
              id="ownPetsDescription"
              name="ownPetsDescription"
              placeholder="One 4-year-old Lab, very social; one senior cat who keeps to herself"
            />
          </Field>
        </Fieldset>

        {/* ------------------------------------------------------- Accepts */}
        <Fieldset
          legend="What you accept"
          hint="We hide you from anyone whose pet doesn’t match — so you only get requests you can say yes to."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard name="acceptsDogs" label="Dogs" defaultChecked />
            <CheckboxCard name="acceptsCats" label="Cats" />
          </div>

          {offersHomeCare && (
            <div className="grid gap-5 sm:grid-cols-2">
              {selected.includes('boarding') && (
                <Field
                  label="Pets per night (boarding)"
                  htmlFor="maxBoardingPets"
                  required
                  hint="How many pets you accept to sleep over at the same time. Only applies to boarding."
                >
                  <Input
                    id="maxBoardingPets"
                    name="maxBoardingPets"
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    required
                  />
                </Field>
              )}
              {selected.includes('daycare') && (
                <Field
                  label="Pets per day (daycare)"
                  htmlFor="maxDaycarePets"
                  required
                  hint="How many pets you accept during the day. Only applies to daycare."
                >
                  <Input
                    id="maxDaycarePets"
                    name="maxDaycarePets"
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    required
                  />
                </Field>
              )}
            </div>
          )}

          <div>
            <p className="mb-2.5 text-sm font-medium text-espresso-700">
              What size of dogs? <span className="text-gold-600">*</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <CheckboxCard name="acceptedSizes" value="small" label="Small dog (0–15 lbs)" />
              <CheckboxCard name="acceptedSizes" value="medium" label="Medium dog (16–40 lbs)" />
              <CheckboxCard name="acceptedSizes" value="large" label="Large dog (41–100 lbs)" />
              <CheckboxCard name="acceptedSizes" value="giant" label="Giant dog (101+ lbs)" />
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-sm font-medium text-espresso-700">
              Are you able to host any of the following? <span className="text-gold-600">*</span>
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <CheckboxCard
                name="hostsMultipleFamilies"
                label="Pets from different families at the same time"
              />
              <CheckboxCard name="acceptsPuppies" label="Puppies under 1 year old" />
              <CheckboxCard
                name="acceptsNotCrateTrained"
                label="Dogs that are not crate trained"
              />
              <CheckboxCard name="acceptsUnneuteredMales" label="Unneutered male dogs" />
              <CheckboxCard name="acceptsUnspayedFemales" label="Unspayed female dogs" />
              <CheckboxCard name="acceptsInHeat" label="Female dogs in heat" />
              <CheckboxCard name="hostNone" label="None of the above" />
            </div>
          </div>
        </Fieldset>

        {/* ---------------------------------------------------- Cancellation */}
        <Fieldset legend="Cancellation policy">
          <Field
            label="Which policy fits you?"
            htmlFor="cancellationPolicy"
            required
            hint="Owners see this before they book. It applies to all your services — you can set a different one per service later."
          >
            <Select id="cancellationPolicy" name="cancellationPolicy" defaultValue="" required>
              <option value="">Select…</option>
              <option value="same_day">Same Day</option>
              <option value="one_day">One Day</option>
              <option value="three_day">Three Day</option>
              <option value="seven_day">Seven Day</option>
            </Select>
          </Field>
          <CancellationPoliciesHelp />
        </Fieldset>

        <div className="space-y-3 rounded-2xl border border-espresso-700/10 bg-hv-paper p-5 text-[17px] leading-relaxed text-espresso-600">
          <p className="font-semibold text-espresso-700">Here’s what happens next 🐾</p>
          <p>We’ll walk you through every step, so you’re never guessing.</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <strong>Background check.</strong> As soon as you submit, we’ll take you to our
              background check and ask for your consent.
            </li>
            <li>
              <strong>Video interview.</strong> Once your background check clears, we’ll set up
              a friendly video call to get to know you.
            </li>
            <li>
              <strong>Home video (boarding and daycare).</strong> You’ll send us a short video of
              your space. With your OK, we’ll share it with pet parents so they can see exactly
              where their furry babies will stay.
            </li>
            <li>
              <strong>Insurance.</strong> For everyone’s safety, we’ll set up your coverage as
              soon as you get your first booking on Havenr.
            </li>
          </ol>
          <p>
            Once you’re approved, you can set your preferences for each service (boarding,
            daycare, house sitting, walking, and drop-in visits) in Settings.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Submit intent="submit" label="Submit for review" />
          <Submit intent="save" label="Save and finish later" />
        </div>
      </form>
    </div>
  );
}
