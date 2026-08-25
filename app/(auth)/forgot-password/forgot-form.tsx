'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Field, FormError, FormNote, Input } from '@/components/ui/field';

import { requestPasswordResetAction, type ResetState } from './actions';

const INITIAL: ResetState = { error: null, sent: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Send reset link'}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    INITIAL
  );

  if (state.sent) {
    return (
      <div className="mt-8">
        <FormNote>
          If an account exists for that address, a reset link is on its way.
          Check your spam folder if it doesn’t arrive in a few minutes.
        </FormNote>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <FormError message={state.error} />

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

      <Submit />
    </form>
  );
}
