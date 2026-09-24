'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { formatCents } from '@/lib/utils';

import { createCheckoutSessionAction, type PayActionState } from './payment-actions';

const INITIAL: PayActionState = { error: null };

function Submit({ totalCents }: { totalCents: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Opening checkout…' : `Pay ${formatCents(totalCents)}`}
    </Button>
  );
}

export function PayButton({
  bookingId,
  totalCents,
}: {
  bookingId: string;
  totalCents: number;
}) {
  const [state, formAction] = useActionState(
    async (_prev: PayActionState) => createCheckoutSessionAction(bookingId),
    INITIAL
  );

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state.error} />
      <Submit totalCents={totalCents} />
    </form>
  );
}
