'use client';

import { useActionState, useState } from 'react';

import { decideBackgroundCheckAction, type DecisionState } from './actions';

const INITIAL: DecisionState = { error: null };

export function DecisionButtons({
  sitterId,
  status,
}: {
  sitterId: string;
  status: string;
}) {
  const [state, formAction, pending] = useActionState(decideBackgroundCheckAction, INITIAL);
  const [rejecting, setRejecting] = useState(false);

  const Hidden = ({ decision }: { decision: string }) => (
    <>
      <input type="hidden" name="sitterId" value={sitterId} />
      <input type="hidden" name="decision" value={decision} />
    </>
  );

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {status !== 'rejected' && !rejecting && (
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="h-9 rounded-full border border-red-300 px-4 text-[16px] font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            Not approved
          </button>
        )}
        {status !== 'clear' && (
          <form action={formAction}>
            <Hidden decision="clear" />
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-full bg-hv-ink px-4 text-[16px] font-semibold text-hv-cream transition-colors hover:bg-hv-cocoa disabled:opacity-55"
            >
              Mark clear
            </button>
          </form>
        )}
        {status !== 'not_started' && (
          <form action={formAction}>
            <Hidden decision="reset" />
            <button
              type="submit"
              disabled={pending}
              className="h-9 rounded-full px-3 text-[16px] font-semibold text-espresso-500 hover:text-espresso-700 disabled:opacity-55"
            >
              Reset
            </button>
          </form>
        )}
      </div>

      {rejecting && (
        <form action={formAction} className="flex w-72 flex-col gap-2">
          <Hidden decision="rejected" />
          <textarea
            name="note"
            required
            rows={3}
            placeholder="Reason shown to the Havener"
            className="w-full rounded-2xl border border-hv-ink/20 bg-hv-paper p-3 text-[16px] text-espresso-700 focus:border-hv-ink focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-full bg-red-600 px-4 text-[16px] font-semibold text-white hover:bg-red-700 disabled:opacity-55"
          >
            Confirm — not approved
          </button>
        </form>
      )}

      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
    </div>
  );
}
