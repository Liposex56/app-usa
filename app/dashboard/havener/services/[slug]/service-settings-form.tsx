'use client';

import { useActionState, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Fieldset } from '@/components/onboarding/steps';
import { Button } from '@/components/ui/button';
import {
  CheckboxCard,
  Field,
  FormError,
  FormNote,
  Input,
  Select,
} from '@/components/ui/field';
import type {
  DayOfWeek,
  PetSize,
  PottyBreakFrequency,
  ServiceCancellationPolicy,
  SitterProfileRow,
  SitterServiceRow,
} from '@/lib/database.types';
import { computeFeeSplit } from '@/lib/payments';
import type { ServiceDefinition } from '@/lib/services';
import { formatCents } from '@/lib/utils';

import { saveServiceSettingsAction, type ServiceSettingsState } from '../actions';

const INITIAL: ServiceSettingsState = { error: null };

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'sun', label: 'Sun' },
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
];

const CANCELLATION_OPTIONS: { value: ServiceCancellationPolicy; label: string }[] =
  [
    { value: 'same_day', label: 'Same Day' },
    { value: 'one_day', label: 'One Day' },
    { value: 'three_day', label: 'Three Day' },
    { value: 'seven_day', label: 'Seven Day' },
  ];

function cents(value: number | null | undefined): string {
  return value != null ? String(value / 100) : '';
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  );
}

export function ServiceSettingsForm({
  service,
  existing,
  sitterProfile,
  commissionPercent,
}: {
  service: ServiceDefinition;
  existing: SitterServiceRow | null;
  sitterProfile: SitterProfileRow;
  commissionPercent: number;
}) {
  const [state, formAction] = useActionState(saveServiceSettingsAction, INITIAL);

  const [baseRate, setBaseRate] = useState(cents(existing?.base_rate_cents) || '');
  const [yardType, setYardType] = useState<'fenced' | 'unfenced' | 'none'>(
    sitterProfile.yard_is_fenced
      ? 'fenced'
      : sitterProfile.has_yard
        ? 'unfenced'
        : 'none'
  );

  const split = useMemo(() => {
    const totalCents = Math.round((Number.parseFloat(baseRate) || 0) * 100);
    return computeFeeSplit(totalCents, commissionPercent);
  }, [baseRate, commissionPercent]);

  return (
    <div>
      <div className="mb-8 mt-6">
        <h1 className="text-3xl leading-tight">{service.name} settings</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-espresso-500">
          Owners search for Haveners who match what they need, then request to
          book. What you set here is what decides who can find you for{' '}
          {service.name.toLowerCase()}.
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="serviceType" value={service.type} />
        <FormError message={state.error} />

        <Fieldset legend="Search settings">
          <CheckboxCard
            name="isActive"
            label="Active"
            description="New and past pet parents can find you in search and request to book this service."
            defaultChecked={existing?.is_active ?? true}
          />
          <CheckboxCard
            name="isPaused"
            label="Away"
            description="Taking a break from requests, or unable to respond for a while? Mark this service as away."
            defaultChecked={existing?.is_paused ?? false}
          />
          <CheckboxCard
            name="acceptsNewCustomers"
            label="New customers"
            description="Receive requests from owners you haven't worked with before."
            defaultChecked={existing?.accepts_new_customers ?? true}
          />
        </Fieldset>

        <Fieldset legend="Pet care" hint="Select at least one type of pet you want to care for.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="acceptsDogs"
              label="Dogs"
              defaultChecked={existing?.accepts_dogs ?? service.species.includes('dog')}
            />
            <CheckboxCard
              name="acceptsCats"
              label="Cats"
              defaultChecked={existing?.accepts_cats ?? service.species.includes('cat')}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Rates">
          <Field
            label={`Rate per ${service.rateUnit} (USD)`}
            htmlFor="baseRate"
            required
          >
            <Input
              id="baseRate"
              name="baseRate"
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              placeholder={String(service.fromRate)}
              required
            />
          </Field>
          {split.totalCents > 0 && (
            <p className="text-xs text-espresso-500/70">
              What you&rsquo;ll earn per service: {formatCents(split.sitterPayoutCents)}{' '}
              (Havenr keeps {commissionPercent}%)
            </p>
          )}

          <Field label="Additional pet (USD)" htmlFor="additionalPetRate">
            <Input
              id="additionalPetRate"
              name="additionalPetRate"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              defaultValue={cents(existing?.additional_pet_rate_cents)}
              placeholder="0"
            />
          </Field>

          <p className="pt-2 text-sm font-medium text-espresso-700">
            Additional rates
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Holiday rate (USD)" htmlFor="holidayRate">
              <Input
                id="holidayRate"
                name="holidayRate"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                defaultValue={cents(existing?.holiday_rate_cents)}
              />
            </Field>
            <Field label="Extended stay rate (USD)" htmlFor="extendedStayRate">
              <Input
                id="extendedStayRate"
                name="extendedStayRate"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                defaultValue={cents(existing?.extended_stay_rate_cents)}
              />
            </Field>
            <Field label="Bathing / grooming (USD)" htmlFor="bathingRate">
              <Input
                id="bathingRate"
                name="bathingRate"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                defaultValue={cents(existing?.bathing_rate_cents)}
              />
            </Field>
            <Field
              label="Pick-up and drop-off (USD)"
              htmlFor="pickupDropoffRate"
              hint="Round trip."
            >
              <Input
                id="pickupDropoffRate"
                name="pickupDropoffRate"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                defaultValue={cents(existing?.pickup_dropoff_rate_cents)}
              />
            </Field>
          </div>
        </Fieldset>

        <Fieldset
          legend="Availability"
          hint="Shared across all your services — editing it here updates it everywhere."
        >
          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              Are you home full-time during the week?
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-espresso-700">
                <input
                  type="radio"
                  name="homeFullTime"
                  value="yes"
                  defaultChecked={sitterProfile.home_full_time}
                  className="accent-gold-500"
                />
                Yes
              </label>
              <label className="flex items-center gap-2 text-sm text-espresso-700">
                <input
                  type="radio"
                  name="homeFullTime"
                  value="no"
                  defaultChecked={!sitterProfile.home_full_time}
                  className="accent-gold-500"
                />
                No
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              What days are you typically available?
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((day) => (
                <CheckboxCard
                  key={day.value}
                  name="availableDays"
                  value={day.value}
                  label={day.label}
                  defaultChecked={sitterProfile.available_days.includes(day.value)}
                />
              ))}
            </div>
          </div>

          <CheckboxCard
            name="acceptsExtendedStays"
            label="Willing to accept stays longer than one week"
            defaultChecked={sitterProfile.accepts_extended_stays}
          />

          <Field
            label="How frequently can you provide potty breaks?"
            htmlFor="pottyBreakFrequency"
          >
            <Select
              id="pottyBreakFrequency"
              name="pottyBreakFrequency"
              defaultValue={sitterProfile.potty_break_frequency ?? '2-4h'}
            >
              {(['0-2h', '2-4h', '4-8h', '8+h'] as PottyBreakFrequency[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                )
              )}
            </Select>
          </Field>

          <Field
            label="How far in advance do new clients need to reach out?"
            htmlFor="advanceNoticeDays"
            hint="0 means you accept same-day bookings."
          >
            <Input
              id="advanceNoticeDays"
              name="advanceNoticeDays"
              type="number"
              min="0"
              max="30"
              inputMode="numeric"
              defaultValue={sitterProfile.advance_notice_days}
            />
          </Field>
        </Fieldset>

        <Fieldset
          legend="About your home"
          hint="Shared across all your services."
        >
          <Field label="What type of home do you live in?" htmlFor="homeType">
            <Select
              id="homeType"
              name="homeType"
              defaultValue={sitterProfile.home_type ?? ''}
            >
              <option value="">Select…</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condo">Condo</option>
              <option value="townhouse">Townhouse</option>
            </Select>
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-espresso-700">
              What type of yard do you have?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  ['fenced', 'Fenced yard'],
                  ['unfenced', 'Unfenced yard'],
                  ['none', 'No yard'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-espresso-700"
                >
                  <input
                    type="radio"
                    checked={yardType === value}
                    onChange={() => setYardType(value)}
                    className="accent-gold-500"
                  />
                  {label}
                </label>
              ))}
            </div>
            <input type="hidden" name="hasYard" value={yardType !== 'none' ? 'on' : ''} />
            <input
              type="hidden"
              name="yardIsFenced"
              value={yardType === 'fenced' ? 'on' : ''}
            />
          </div>

          <p className="text-sm font-medium text-espresso-700">
            What can pet owners expect at your home?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="allowsSmoking"
              label="Smoking inside home"
              defaultChecked={sitterProfile.allows_smoking}
            />
            <CheckboxCard
              name="hasKidsAtHome"
              label="Children at home"
              defaultChecked={sitterProfile.has_kids_at_home}
            />
            <CheckboxCard
              name="dogsOnFurniture"
              label="Dogs allowed on furniture"
              defaultChecked={sitterProfile.dogs_on_furniture}
            />
            <CheckboxCard
              name="dogsOnBed"
              label="Dogs allowed on bed"
              defaultChecked={sitterProfile.dogs_on_bed}
            />
            <CheckboxCard
              name="hasOwnPets"
              label="Other pets in home"
              defaultChecked={sitterProfile.has_own_pets}
            />
          </div>

          <p className="text-sm font-medium text-espresso-700">
            Are you able to host any of the following?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxCard
              name="hostsMultipleFamilies"
              label="Pets from different families at the same time"
              defaultChecked={sitterProfile.hosts_multiple_families}
            />
            <CheckboxCard
              name="acceptsPuppies"
              label="Puppies under 1 year old"
              defaultChecked={sitterProfile.accepts_puppies}
            />
            <CheckboxCard
              name="acceptsNotCrateTrained"
              label="Dogs that are not crate trained"
              defaultChecked={sitterProfile.accepts_not_crate_trained}
            />
            <CheckboxCard
              name="acceptsUnfixed"
              label="Unspayed or unneutered pets"
              defaultChecked={sitterProfile.accepts_unfixed}
            />
            <CheckboxCard
              name="acceptsInHeat"
              label="Female dogs in heat"
              defaultChecked={sitterProfile.accepts_in_heat}
            />
          </div>
        </Fieldset>

        <Fieldset legend="Pet preferences" hint="Shared across all your services.">
          <Field
            label="How many pets per day can you host?"
            htmlFor="maxPetsPerDay"
            hint="Counting your own."
          >
            <Input
              id="maxPetsPerDay"
              name="maxPetsPerDay"
              type="number"
              min="1"
              max="20"
              inputMode="numeric"
              defaultValue={sitterProfile.max_pets_per_day}
            />
          </Field>

          <div>
            <p className="mb-2.5 text-sm font-medium text-espresso-700">
              What type of pets can you host?
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(
                [
                  ['small', 'Small dog (0–15 lbs)'],
                  ['medium', 'Medium dog (16–40 lbs)'],
                  ['large', 'Large dog (41–100 lbs)'],
                  ['giant', 'Giant dog (101+ lbs)'],
                ] as [PetSize, string][]
              ).map(([value, label]) => (
                <CheckboxCard
                  key={value}
                  name="acceptedSizes"
                  value={value}
                  label={label}
                  defaultChecked={sitterProfile.accepted_sizes.includes(value)}
                />
              ))}
            </div>
          </div>
        </Fieldset>

        <Fieldset legend="Cancellation policy">
          <Field
            label={`What is your cancellation policy for ${service.name}?`}
            htmlFor="cancellationPolicy"
          >
            <Select
              id="cancellationPolicy"
              name="cancellationPolicy"
              defaultValue={existing?.cancellation_policy ?? 'three_day'}
            >
              {CANCELLATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-espresso-500/70">
            Note: Haveners must abide by applicable laws and regulations.
          </p>
        </Fieldset>

        <FormNote>
          Availability, home details and pet preferences are shared with your
          other services — change them once here and they apply everywhere.
        </FormNote>

        <Submit />
      </form>
    </div>
  );
}
