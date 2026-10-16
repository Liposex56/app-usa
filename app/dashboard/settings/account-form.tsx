'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Fieldset } from '@/components/onboarding/steps';
import { Button } from '@/components/ui/button';
import { CheckboxCard, Field, FormError, FormNote, Input } from '@/components/ui/field';

import { saveAccountAction, type AccountState } from './actions';

const INITIAL: AccountState = { error: null, saved: false };

export type AccountFields = {
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  marketing_opt_in: boolean;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  );
}

export function AccountForm({ profile }: { profile: AccountFields }) {
  const [state, formAction] = useActionState(saveAccountAction, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />
      {state.saved && (
        <p
          role="status"
          className="rounded-2xl border border-green-300/60 bg-green-50 px-4 py-3 text-[16px] font-medium text-green-800"
        >
          Your details are saved.
        </p>
      )}

      <Fieldset legend="About you">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={profile.first_name ?? ''}
              autoComplete="given-name"
              required
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" required>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={profile.last_name ?? ''}
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <Field
          label="Display name"
          htmlFor="displayName"
          hint="What other people see. Couples and families can use a shared name."
        >
          <Input id="displayName" name="displayName" defaultValue={profile.display_name ?? ''} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" hint="Your sign-in email.">
            <Input id="email" value={profile.email ?? ''} readOnly disabled />
          </Field>
          <Field label="Mobile number" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ''}
              autoComplete="tel"
              placeholder="(555) 123-4567"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        legend="Your address"
        hint="Only used to find Haveners near you. Your street address is never shown to anyone until you confirm a booking."
      >
        <Field label="Street address" htmlFor="addressLine1">
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={profile.address_line1 ?? ''}
            autoComplete="address-line1"
          />
        </Field>
        <Field label="Apartment, suite, unit" htmlFor="addressLine2">
          <Input
            id="addressLine2"
            name="addressLine2"
            defaultValue={profile.address_line2 ?? ''}
            autoComplete="address-line2"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" htmlFor="city">
            <Input
              id="city"
              name="city"
              defaultValue={profile.city ?? ''}
              autoComplete="address-level2"
            />
          </Field>
          <Field label="State" htmlFor="state">
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={profile.state ?? ''}
              autoComplete="address-level1"
              placeholder="MA"
            />
          </Field>
          <Field label="ZIP code" htmlFor="postalCode">
            <Input
              id="postalCode"
              name="postalCode"
              inputMode="numeric"
              defaultValue={profile.postal_code ?? ''}
              autoComplete="postal-code"
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset
        legend="Emergency contact"
        hint="Someone we can call about your pet if we can’t reach you."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="emergencyName">
            <Input
              id="emergencyName"
              name="emergencyName"
              defaultValue={profile.emergency_contact_name ?? ''}
            />
          </Field>
          <Field label="Phone" htmlFor="emergencyPhone">
            <Input
              id="emergencyPhone"
              name="emergencyPhone"
              type="tel"
              defaultValue={profile.emergency_contact_phone ?? ''}
            />
          </Field>
        </div>
      </Fieldset>

      <CheckboxCard
        name="marketingOptIn"
        label="Send me occasional Havenr updates"
        description="Product news and tips. Never your data — we don’t share it with advertisers."
        defaultChecked={profile.marketing_opt_in}
      />

      <FormNote>
        Haveners never see your legal name, phone number, street address or payment details. They
        see your display name and the neighborhood you are in.
      </FormNote>

      <Submit />
    </form>
  );
}
