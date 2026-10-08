'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { signUpAction, type AuthState } from '@/app/(auth)/actions';
import { SocialButtons } from '@/components/auth/social-buttons';
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
  const defaultRole = roleParam === 'havener' ? 'havener' : 'owner';
  // A Havener's referral link (/signup?ref=CODE) rides along with the account.
  const referralCode = searchParams.get('ref');

  const [state, formAction] = useActionState(signUpAction, INITIAL);
  // Quick social options first; the full form opens on "Sign Up with Email".
  // Links that already say who you are (?role=havener) skip straight to it.
  const [showEmail, setShowEmail] = useState(Boolean(roleParam || referralCode));

  if (!showEmail) {
    return (
      <div className="mt-8 space-y-3">
        <SocialButtons />
        <div className="flex items-center gap-3 py-1 text-xs text-espresso-500">
          <span className="h-px flex-1 bg-espresso-700/15" />
          or
          <span className="h-px flex-1 bg-espresso-700/15" />
        </div>
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-2 border-espresso-700/70 bg-white px-4 text-[15px] font-semibold text-espresso-700 transition-colors hover:bg-bone"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3.5 7 8.5 6 8.5-6" />
          </svg>
          Sign Up with Email
        </button>
        <p className="pt-3 text-center text-xs leading-relaxed text-espresso-500/75">
          By signing in or signing up, you agree to our{' '}
          <Link href="/legal/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          , and confirm that you are 18 years of age or older.
        </p>
      </div>
    );
  }

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
        <p className="text-xs leading-relaxed text-espresso-500/75">
          You can become a Havener — or add a pet — later from your profile.
        </p>
      </fieldset>
      {referralCode && <input type="hidden" name="ref" value={referralCode} />}

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
