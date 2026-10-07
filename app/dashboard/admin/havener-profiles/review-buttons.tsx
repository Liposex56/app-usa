'use client';

import { useActionState, useState } from 'react';

import { reviewHavenerProfileAction, type ReviewState } from './actions';

const INITIAL_STATE: ReviewState = { error: null };

export function ProfileReviewButtons({
  sitterId,
  canReject,
}: {
  sitterId: string;
  canReject: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    reviewHavenerProfileAction,
    INITIAL_STATE
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    reviewHavenerProfileAction,
    INITIAL_STATE
  );
  const [rejecting, setRejecting] = useState(false);

  const error = approveState.error ?? rejectState.error;
  const busy = approvePending || rejectPending;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {canReject && !rejecting && (
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="h-9 rounded-full border border-red-300 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            Rechazar
          </button>
        )}
        <form action={approveAction}>
          <input type="hidden" name="sitterId" value={sitterId} />
          <input type="hidden" name="decision" value="approved" />
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-full bg-gold-500 px-4 text-sm font-medium text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Aprobar perfil
          </button>
        </form>
      </div>

      {rejecting && (
        <form action={rejectAction} className="flex w-64 flex-col gap-2">
          <input type="hidden" name="sitterId" value={sitterId} />
          <input type="hidden" name="decision" value="rejected" />
          <textarea
            name="reason"
            required
            rows={2}
            placeholder="Qué debe corregir el Havener"
            className="w-full rounded-lg border border-espresso-700/15 bg-white p-2 text-sm text-espresso-700 focus:border-gold-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-full bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            Confirmar rechazo
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
