'use client';

import { useActionState, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import type { BookingStatus } from '@/lib/database.types';

import {
  acceptBookingAction,
  cancelBookingAction,
  completeServiceAction,
  declineBookingAction,
  startServiceAction,
  type ActionState,
} from '../actions';

const INITIAL: ActionState = { error: null };

function ReasonForm({
  action,
  label,
  placeholder,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  label: string;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, INITIAL);

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full space-y-2 rounded-xl border border-espresso-700/12 bg-bone p-3">
      <FormError message={state.error} />
      <textarea
        name="reason"
        required
        placeholder={placeholder}
        className="w-full rounded-lg border border-espresso-700/15 bg-white p-2.5 text-sm text-espresso-700 placeholder:text-espresso-700/35 focus:border-gold-500 focus:outline-none"
        rows={2}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="dark">
          Confirm
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

export function BookingActions({
  bookingId,
  status,
  viewerRole,
}: {
  bookingId: string;
  status: BookingStatus;
  viewerRole: 'owner' | 'sitter';
}) {
  const [isPending, startTransition] = useTransition();
  const decline = declineBookingAction.bind(null, bookingId);
  const cancel = cancelBookingAction.bind(null, bookingId);

  if (viewerRole === 'sitter' && status === 'requested') {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void acceptBookingAction(bookingId);
            })
          }
        >
          Accept
        </Button>
        <ReasonForm
          action={decline}
          label="Decline"
          placeholder="Let them know why (sent to the owner)."
        />
      </div>
    );
  }

  if (viewerRole === 'sitter' && status === 'confirmed') {
    return (
      <div className="flex flex-wrap items-start gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void startServiceAction(bookingId);
            })
          }
        >
          Start service
        </Button>
        <ReasonForm
          action={cancel}
          label="Cancel booking"
          placeholder="Reason for cancelling."
        />
      </div>
    );
  }

  if (viewerRole === 'sitter' && status === 'in_progress') {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void completeServiceAction(bookingId);
          })
        }
      >
        Mark completed
      </Button>
    );
  }

  if (viewerRole === 'owner' && (status === 'requested' || status === 'confirmed')) {
    return (
      <ReasonForm
        action={cancel}
        label="Cancel booking"
        placeholder="Reason for cancelling — the Havener will see this."
      />
    );
  }

  return null;
}
