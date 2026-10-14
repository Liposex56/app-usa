'use client';

import { useActionState } from 'react';

import { decideCancellationAction, type CancellationDecisionState } from './actions';

const INITIAL: CancellationDecisionState = { error: null };

export function CancellationDecisionButtons({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(decideCancellationAction, INITIAL);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="decision" value="decline" />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full border border-espresso-700/25 px-4 text-[16px] font-semibold text-espresso-700 transition-colors hover:bg-hv-sky disabled:opacity-55"
          >
            Keep the booking
          </button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="decision" value="confirm" />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full bg-red-600 px-4 text-[16px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-55"
          >
            Confirm cancellation
          </button>
        </form>
      </div>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
