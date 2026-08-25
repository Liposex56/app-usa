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
}: {
  isOwner: boolean;
  hideSteps?: boolean;
}) {
  const [state, formAction] = useActionState(saveHavenerProfileAction, INITIAL);
  const [selected, setSelected] = useState<string[]>(['boarding']);
  const [offersHomeCare, setOffersHomeCare] = useState(true);

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
            hint="One line that shows under your name in search results."
          >
            <Input
              id="headline"
              name="headline"
              maxLength={90}
              placeholder="Fenced yard, no other pets, 10 years with senior dogs"
            />
          </Field>

          <Field label="About you" htmlFor="bio">
            <Textarea
              id="bio"
              name="bio"
              placeholder="Who you are, why you do this, what kind of pets you’re best with."
            />
          </Field>

          <Field
            label="What a day of care looks like with you"
            htmlFor="routineDescription"
            hint="This is the single most reassuring thing on your profile. Be concrete."
          >
            <Textarea
              id="routineDescription"
              name="routineDescription"
              placeholder="Morning walk at 7, breakfast, backyard time, a nap in the living room, afternoon walk, dinner at 6, bed by 10."
            />
          </Field>

          <Field label="Years of experience" htmlFor="yearsExperience">
            <Input
              id="yearsExperience"
              name="yearsExperience"
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
          hint="We show your city and approximate distance. Your street address is never public."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" htmlFor="serviceCity" required>
              <Input id="serviceCity" name="serviceCity" required />
            </Field>
            <Field label="State" htmlFor="serviceState" required>
              <Input
                id="serviceState"
                name="serviceState"
                maxLength={2}
                placeholder="FL"
                required
              />
            </Field>
            <Field label="ZIP code" htmlFor="servicePostalCode">
              <Input
                id="servicePostalCode"
                name="servicePostalCode"
                inputMode="numeric"
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
        {offersHomeCare && (
          <Fieldset
            legend="Your home"
            hint="Shown to owners considering boarding or daycare. Honest answers here prevent bad matches."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Home type" htmlFor="homeType">
                <Select id="homeType" name="homeType" defaultValue="">
                  <option value="">Select…</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </Select>
              </Field>
              <Field
                label="Max pets per day"
                htmlFor="maxPetsPerDay"
                hint="Counting your own."
              >
                <Input
                  id="maxPetsPerDay"
                  name="maxPetsPerDay"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={2}
                  inputMode="numeric"
                />
              </Field>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <CheckboxCard name="hasYard" label="I have a yard" />
              <CheckboxCard name="yardIsFenced" label="The yard is fully fenced" />
              <CheckboxCard name="hasKidsAtHome" label="There are children at home" />
              <CheckboxCard name="hasOwnPets" label="I have my own pets" />
              <CheckboxCard name="hasStairs" label="There are stairs" />
              <CheckboxCard
                name="worksOutsideHome"
                label="I work outside the home"
                description="Owners want to know how many hours a pet would be alone."
              />
              <CheckboxCard
                name="providesDailyExercise"
                label="I provide daily exercise"
                defaultChecked
              />
            </div>

            <Field label="Tell us about your pets" htmlFor="ownPetsDescription">
              <Input
                id="ownPetsDescription"
                name="ownPetsDescription"
                placeholder="One 4-year-old Lab, very social; one senior cat who keeps to herself"
              />
            </Field>
          </Fieldset>
        )}

        {/* ------------------------------------------------------- Accepts */}
        <Fieldset
          legend="What you accept"
          hint="We hide you from anyone whose pet doesn’t match — so you only get requests you can say yes to."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard name="acceptsDogs" label="Dogs" defaultChecked />
            <CheckboxCard name="acceptsCats" label="Cats" />
          </div>

          <div>
            <p className="mb-2.5 text-sm font-medium text-espresso-700">Sizes</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <CheckboxCard
                name="acceptedSizes"
                value="small"
                label="Small — up to 25 lb"
                defaultChecked
              />
              <CheckboxCard
                name="acceptedSizes"
                value="medium"
                label="Medium — 26 to 60 lb"
                defaultChecked
              />
              <CheckboxCard
                name="acceptedSizes"
                value="large"
                label="Large — 61 to 100 lb"
              />
              <CheckboxCard
                name="acceptedSizes"
                value="giant"
                label="Giant — over 100 lb"
              />
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-sm font-medium text-espresso-700">
              Energy levels
            </p>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <CheckboxCard
                name="acceptedEnergyLevels"
                value="low"
                label="Low"
                defaultChecked
              />
              <CheckboxCard
                name="acceptedEnergyLevels"
                value="moderate"
                label="Moderate"
                defaultChecked
              />
              <CheckboxCard
                name="acceptedEnergyLevels"
                value="high"
                label="High"
              />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard name="acceptsPuppies" label="Puppies" />
            <CheckboxCard name="acceptsSeniors" label="Senior pets" defaultChecked />
            <CheckboxCard name="acceptsUnfixed" label="Not spayed or neutered" />
            <CheckboxCard name="acceptsInHeat" label="Pets in heat" />
            <CheckboxCard
              name="comfortableWithMeds"
              label="I can give medication"
            />
            <CheckboxCard
              name="comfortableWithAnxiety"
              label="I’m comfortable with anxious pets"
            />
            <CheckboxCard
              name="comfortableWithReactive"
              label="I’m comfortable with reactive pets"
            />
          </div>
        </Fieldset>

        {/* ---------------------------------------------------- Cancellation */}
        <Fieldset legend="Cancellation policy">
          <Field
            label="Which policy fits you?"
            htmlFor="cancellationPolicy"
            hint="Owners see this before they book. Havenr applies the fee automatically."
          >
            <Select
              id="cancellationPolicy"
              name="cancellationPolicy"
              defaultValue="moderate"
            >
              <option value="flexible">
                Flexible — full refund up to 24 hours before
              </option>
              <option value="moderate">
                Moderate — full refund up to 3 days before
              </option>
              <option value="strict">
                Strict — 50% refund up to 7 days before
              </option>
            </Select>
          </Field>
        </Fieldset>

        <FormNote>
          Submitting sends your profile for review. You still need to pass the
          background check, interview, home verification and insurance review
          before you can receive bookings — we’ll walk you through each one.
        </FormNote>

        <div className="flex flex-wrap gap-3">
          <Submit intent="submit" label="Submit for review" />
          <Submit intent="save" label="Save and finish later" />
        </div>
      </form>
    </div>
  );
}
