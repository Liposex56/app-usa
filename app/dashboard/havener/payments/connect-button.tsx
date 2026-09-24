'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';

import { connectStripeAction, type ConnectActionState } from './actions';

const INITIAL: ConnectActionState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Conectando…' : 'Conectar con Stripe'}
    </Button>
  );
}

export function ConnectButton() {
  const [state, formAction] = useActionState(
    async (prev: ConnectActionState) => connectStripeAction(),
    INITIAL
  );

  return (
    <form action={formAction}>
      <FormError message={state.error} />
      <Submit />
    </form>
  );
}
