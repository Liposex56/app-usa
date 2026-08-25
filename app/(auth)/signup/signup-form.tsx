'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { signUpAction, type AuthState } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input, RadioCard } from '@/components/ui/field';

const INITIAL: AuthState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Creating your account…' : 'Create account'}
    </Button>
  );
}

export function SignUpForm() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const defaultRole =
    roleParam === 'havener' || roleParam === 'both' ? roleParam : 'owner';

  const [state, formAction] = useActionState(signUpAction, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <FormError message={state.error} />

      <fieldset className="space-y-2.5">
        <legend className="mb-2.5 block text-sm font-medium text-espresso-700">
          What brings you to Havenr?
        </legend>
        <RadioCard
          name="role"
          value="owner"
          label="I need care for my pet"
          description="Book boarding, daycare, house sitting, walks or visits."
          defaultChecked={defaultRole === 'owner'}
          required
        />
        <RadioCard
          name="role"
          value="havener"
          label="I want to become a Havener"
          description="Offer care and get paid. Requires verification before you can take bookings."
          defaultChecked={defaultRole === 'havener'}
        />
        <RadioCard
          name="role"
          value="both"
          label="Both"
          description="You can switch between the two at any time."
          defaultChecked={defaultRole === 'both'}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
          />
        </Field>
        <Field label="Last name" htmlFor="lastName" required>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <SubmitButton />

      <p className="text-center text-xs leading-relaxed text-espresso-500/75">
        By creating an account you agree to our{' '}
        <Link href="/legal/terms" className="underline underline-offset-2">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/legal/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
