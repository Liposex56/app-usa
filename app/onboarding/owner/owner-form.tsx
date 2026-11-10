'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  Fieldset,
  OnboardingHeading,
  Steps,
} from '@/components/onboarding/steps';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Button } from '@/components/ui/button';
import {
  CheckboxCard,
  Field,
  FormError,
  FormNote,
  Input,
} from '@/components/ui/field';

import { saveOwnerProfileAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

type ProfileFields = {
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
  latitude?: number | null;
  longitude?: number | null;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Saving…' : 'Continue'}
    </Button>
  );
}

export function OwnerProfileForm({
  profile,
  isOwner,
}: {
  profile: ProfileFields;
  isOwner: boolean;
}) {
  const [state, formAction] = useActionState(saveOwnerProfileAction, INITIAL);
  // Picking a suggested address fills the street, city, state and ZIP.
  const [address, setAddress] = useState({
    street: profile.address_line1 ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    postalCode: profile.postal_code ?? '',
  });

  return (
    <div>
      <Steps
        current="owner_profile"
        sequence={isOwner ? ['role', 'owner_profile', 'pet'] : ['role', 'owner_profile', 'havener']}
      />

      <OnboardingHeading
        title="A few details about you"
        description="This is how we reach you and, if something goes wrong, how we reach someone who can help."
      />

      <form action={formAction} className="space-y-6">
        <FormError message={state.error} />

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
            hint="What other people see. Couples and families can use a shared name like “Pamela & Sebastian”."
          >
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.display_name ?? ''}
              placeholder="Pamela & Sebastian"
            />
          </Field>

          <Field
            label="Mobile number"
            htmlFor="phone"
            required
            hint="Used for booking alerts. We verify it by SMS before your first booking."
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ''}
              autoComplete="tel"
              placeholder="(555) 123-4567"
              required
            />
          </Field>
        </Fieldset>

        <Fieldset
          legend="Your address"
          hint="Only used to find Haveners near you. Your street address is never shown to anyone until you confirm a booking."
        >
          <Field
            label="Street address"
            htmlFor="addressSearch"
            required
            hint="Start typing and pick your address from the list — the city, state and ZIP fill in by themselves."
          >
            <AddressAutocomplete
              id="addressSearch"
              name="addressFull"
              latName="latitude"
              lngName="longitude"
              required
              defaultAddress={
                profile.address_line1
                  ? [
                      profile.address_line1,
                      profile.city,
                      [profile.state, profile.postal_code].filter(Boolean).join(' '),
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : ''
              }
              defaultLat={profile.latitude}
              defaultLng={profile.longitude}
              onSelect={(picked) =>
                setAddress({
                  street: picked.street ?? picked.label,
                  city: picked.city ?? '',
                  state: picked.state ?? '',
                  postalCode: picked.postcode ?? '',
                })
              }
            />
          </Field>
          <input type="hidden" name="addressLine1" value={address.street} />
          <Field label="Apartment, suite, unit" htmlFor="addressLine2">
            <Input
              id="addressLine2"
              name="addressLine2"
              defaultValue={profile.address_line2 ?? ''}
              autoComplete="address-line2"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="City" htmlFor="city" required>
              <Input
                id="city"
                name="city"
                value={address.city}
                onChange={(event) => setAddress({ ...address, city: event.target.value })}
                required
              />
            </Field>
            <Field label="State" htmlFor="state" required>
              <Input
                id="state"
                name="state"
                maxLength={2}
                value={address.state}
                onChange={(event) =>
                  setAddress({ ...address, state: event.target.value.toUpperCase() })
                }
                placeholder="MA"
                required
              />
            </Field>
            <Field label="ZIP code" htmlFor="postalCode" required>
              <Input
                id="postalCode"
                name="postalCode"
                inputMode="numeric"
                value={address.postalCode}
                onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                required
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
        />

        <FormNote>
          Haveners never see your legal name, phone number, street address or
          payment details. They see your display name and the neighborhood you
          are in.
        </FormNote>

        <Submit />
      </form>
    </div>
  );
}
