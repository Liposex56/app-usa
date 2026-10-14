'use client';

import { useActionState, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { isTimedService } from '@/lib/booking-flow';
import type { BookingStatus } from '@/lib/database.types';

import {
  cancelBookingAction,
  completeServiceAction,
  declineBookingAction,
  requestCancellationAction,
  startServiceAction,
  type ActionState,
} from '../actions';

const INITIAL: ActionState = { error: null };

export type CancellationInfo = {
  /** A request is already with Havenr, waiting for confirmation. */
  requested: boolean;
  /** Still inside the Havener's cancellation window. */
  open: boolean;
  lastDayLabel: string;
  policyLabel: string;
};

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
    <form
      action={formAction}
      className="w-full space-y-2 rounded-2xl border border-espresso-700/12 bg-bone p-3"
    >
      <FormError message={state.error} />
      <textarea
        name="reason"
        required
        placeholder={placeholder}
        className="w-full rounded-xl border border-hv-ink/20 bg-hv-paper p-2.5 text-[17px] text-espresso-700 placeholder:text-espresso-700/40 focus:border-hv-ink focus:outline-none"
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

/**
 * Cancelling a confirmed booking: a request that Havenr confirms, allowed
 * only inside the Havener's cancellation window and never during the service.
 */
function CancellationBlock({
  bookingId,
  cancellation,
}: {
  bookingId: string;
  cancellation: CancellationInfo;
}) {
  if (cancellation.requested) {
    return (
      <p className="rounded-2xl bg-hv-butter p-3 text-[16px] font-medium text-olive-700">
        Cancellation requested — Havenr will review it and confirm.
      </p>
    );
  }

  if (!cancellation.open) {
    return (
      <p className="text-[16px] leading-snug text-espresso-500">
        The {cancellation.policyLabel} cancellation window ended on{' '}
        {cancellation.lastDayLabel}, so this booking can no longer be cancelled.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ReasonForm
        action={requestCancellationAction.bind(null, bookingId)}
        label="Request cancellation"
        placeholder="Why are you cancelling?"
      />
      <p className="text-[15px] leading-snug text-espresso-500">
        You can ask to cancel until {cancellation.lastDayLabel} (
        {cancellation.policyLabel} policy). Havenr confirms every cancellation.
      </p>
    </div>
  );
}

export function BookingActions({
  bookingId,
  status,
  viewerRole,
  serviceType,
  cancellation,
}: {
  bookingId: string;
  status: BookingStatus;
  viewerRole: 'owner' | 'sitter';
  serviceType: string;
  cancellation: CancellationInfo | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const cancel = cancelBookingAction.bind(null, bookingId);
  const decline = declineBookingAction.bind(null, bookingId);
  const timed = isTimedService(serviceType);

  // The Havener books from the buttons under the details; here they can also
  // turn the request down outright.
  if (viewerRole === 'sitter' && status === 'requested') {
    return (
      <ReasonForm
        action={decline}
        label="Decline request"
        placeholder="Let them know why you can’t take this one."
      />
    );
  }

  if (viewerRole === 'owner' && status === 'requested') {
    return (
      <ReasonForm
        action={cancel}
        label="Withdraw request"
        placeholder="Reason — the Havener will see this."
      />
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="space-y-3">
        {viewerRole === 'sitter' && !timed && (
          <>
            <FormError message={actionError} />
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await startServiceAction(bookingId);
                  setActionError(result.error);
                })
              }
            >
              Start service
            </Button>
          </>
        )}
        {timed && (
          <p className="text-[16px] leading-snug text-espresso-500">
            This service starts by itself at the drop-off time and finishes by itself at
            the pick-up time.
          </p>
        )}
        {cancellation && (
          <CancellationBlock bookingId={bookingId} cancellation={cancellation} />
        )}
      </div>
    );
  }

  if (status === 'in_progress') {
    if (timed) {
      return (
        <p className="text-[16px] leading-snug text-espresso-500">
          In progress — it finishes by itself at the pick-up time.
          {viewerRole === 'sitter' ? ' Send photos and updates in the chat.' : ''}
        </p>
      );
    }
    if (viewerRole === 'sitter') {
      return (
        <div className="space-y-2">
          <FormError message={actionError} />
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await completeServiceAction(bookingId);
                setActionError(result.error);
              })
            }
          >
            Mark completed
          </Button>
        </div>
      );
    }
    return (
      <p className="text-[16px] leading-snug text-espresso-500">
        A service in progress can’t be cancelled.
      </p>
    );
  }

  return null;
}
