'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';

import { createIdentitySessionAction, type VerifyActionState } from './actions';

const INITIAL: VerifyActionState = { error: null };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Abriendo…' : label}
    </Button>
  );
}

export function VerifyButton({ label }: { label: string }) {
  const [state, formAction] = useActionState(
    async (_prev: VerifyActionState) => createIdentitySessionAction(),
    INITIAL
  );

  return (
    <form action={formAction}>
      <FormError message={state.error} />
      <Submit label={label} />
    </form>
  );
}
