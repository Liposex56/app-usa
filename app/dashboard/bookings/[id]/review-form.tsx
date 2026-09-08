'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { FormError, Textarea } from '@/components/ui/field';

import { submitReviewAction, type ActionState } from '../actions';

const INITIAL: ActionState = { error: null };

function Stars({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className="text-xl leading-none"
        >
          <span className={n <= value ? 'text-gold-500' : 'text-espresso-700/15'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Sending…' : 'Submit review'}
    </Button>
  );
}

export function ReviewForm({
  bookingId,
  revieweeId,
  revieweeLabel,
}: {
  bookingId: string;
  revieweeId: string;
  revieweeLabel: string;
}) {
  const action = submitReviewAction.bind(null, bookingId, revieweeId);
  const [state, formAction] = useActionState(action, INITIAL);
  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [petCare, setPetCare] = useState(0);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <div>
        <p className="text-sm font-medium text-espresso-700">
          Rate {revieweeLabel}
        </p>
        <div className="mt-1.5">
          <Stars name="rating" value={rating} onChange={setRating} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-espresso-600">Punctuality</p>
          <Stars name="punctuality" value={punctuality} onChange={setPunctuality} />
        </div>
        <div>
          <p className="text-xs font-medium text-espresso-600">Communication</p>
          <Stars name="communication" value={communication} onChange={setCommunication} />
        </div>
        <div>
          <p className="text-xs font-medium text-espresso-600">Pet care</p>
          <Stars name="petCare" value={petCare} onChange={setPetCare} />
        </div>
      </div>
      <Textarea name="body" placeholder="Optional — what should other Havenr users know?" />
      <Submit />
    </form>
  );
}
