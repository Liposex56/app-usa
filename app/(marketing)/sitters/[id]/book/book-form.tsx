'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea, FormError } from '@/components/ui/field';
import type { ServiceType, Species } from '@/lib/database.types';
import { formatCents } from '@/lib/utils';

import { requestBookingAction, type BookingActionState } from './actions';

const INITIAL: BookingActionState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Sending…' : 'Send request'}
    </Button>
  );
}

export function BookingForm({
  sitterId,
  services,
  pets,
}: {
  sitterId: string;
  services: Array<{
    type: ServiceType;
    name: string;
    baseRateCents: number;
    additionalPetRateCents: number;
  }>;
  pets: Array<{ id: string; name: string; species: Species }>;
}) {
  const action = requestBookingAction.bind(null, sitterId);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <FormError message={state.error} />

      <Field label="Service" htmlFor="serviceType" required>
        <Select id="serviceType" name="serviceType" required defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {services.map((s) => (
            <option key={s.type} value={s.type}>
              {s.name} — {formatCents(s.baseRateCents)}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset className="space-y-2.5">
        <legend className="mb-1 block text-sm font-medium text-espresso-700">
          Which pet(s)? <span className="text-gold-600">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {pets.map((pet) => (
            <label
              key={pet.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-espresso-700/12 bg-white p-3 text-sm text-espresso-700 hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
            >
              <input
                type="checkbox"
                name="petIds"
                value={pet.id}
                className="accent-gold-500"
              />
              {pet.name}{' '}
              <span className="text-espresso-500">
                ({pet.species === 'dog' ? 'Dog' : 'Cat'})
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Start date" htmlFor="startDate" required>
          <Input id="startDate" name="startDate" type="date" required />
        </Field>
        <Field label="End date" htmlFor="endDate" hint="Leave blank for a single day.">
          <Input id="endDate" name="endDate" type="date" />
        </Field>
      </div>

      <Field
        label="Anything the Havener should know?"
        htmlFor="notes"
        hint="Confirmed details, drop-off time, anything not already on your pet's profile."
      >
        <Textarea id="notes" name="notes" placeholder="Optional" />
      </Field>

      <Submit />
    </form>
  );
}
