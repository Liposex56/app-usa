'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Select } from '@/components/ui/field';

import { setCallWindowAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

const OPTIONS = [
  'Anytime',
  'Mornings',
  'Afternoons',
  'Evenings',
  'Weekdays only',
  'Weekends only',
];

function SaveIndicator() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="text-xs text-espresso-500">Saving…</span>
  ) : null;
}

export function CallWindow({
  bookingId,
  counterpartyName,
  initialValue,
}: {
  bookingId: string;
  counterpartyName: string;
  initialValue: string | null;
}) {
  const action = setCallWindowAction.bind(null, bookingId);
  const [, formAction] = useActionState(action, INITIAL);

  return (
    <div className="rounded-2xl border border-espresso-700/8 bg-bone p-4">
      <p className="text-sm font-medium text-espresso-700">Connect through Havenr</p>
      <p className="mt-1 text-xs text-espresso-500">
        We don&rsquo;t share personal phone numbers. Masked calling through a
        Havenr number is on its way — for now, this just tells{' '}
        {counterpartyName} when a call would be welcome; the in-app chat is
        the fastest way to reach each other.
      </p>
      <form action={formAction} className="mt-3 flex items-center gap-3">
        <Select
          name="callWindow"
          defaultValue={initialValue ?? 'Anytime'}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="max-w-xs"
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
        <SaveIndicator />
      </form>
    </div>
  );
}
