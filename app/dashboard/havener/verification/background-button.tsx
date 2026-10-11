'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';

import { startBackgroundCheckAction, type BackgroundActionState } from './background-actions';

const INITIAL: BackgroundActionState = { error: null };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Opening…' : label}
    </Button>
  );
}

export function BackgroundCheckButton({ label }: { label: string }) {
  const [state, formAction] = useActionState(
    async (_prev: BackgroundActionState) => startBackgroundCheckAction(),
    INITIAL
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <Submit label={label} />
    </form>
  );
}
