'use client';

import { useActionState } from 'react';

import { reviewInsuranceAction, type ReviewState } from './actions';

const INITIAL_STATE: ReviewState = { error: null };

export function ReviewButtons({ sitterId }: { sitterId: string }) {
  const [state, approveAction, approvePending] = useActionState(
    reviewInsuranceAction,
    INITIAL_STATE
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    reviewInsuranceAction,
    INITIAL_STATE
  );

  const error = state.error ?? rejectState.error;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <form action={rejectAction}>
          <input type="hidden" name="sitterId" value={sitterId} />
          <input type="hidden" name="decision" value="rejected" />
          <button
            type="submit"
            disabled={rejectPending || approvePending}
            className="h-9 rounded-full border border-red-300 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Rechazar
          </button>
        </form>
        <form action={approveAction}>
          <input type="hidden" name="sitterId" value={sitterId} />
          <input type="hidden" name="decision" value="approved" />
          <button
            type="submit"
            disabled={rejectPending || approvePending}
            className="h-9 rounded-full bg-gold-500 px-4 text-sm font-medium text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Aprobar
          </button>
        </form>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
