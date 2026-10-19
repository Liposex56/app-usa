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
  label,
}: {
  name: string;
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <input type="hidden" name={name} value={value} />
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${label}: ${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={n <= value}
          className="text-xl leading-none"
        >
          <span className={n <= value ? 'text-gold-500' : 'text-espresso-700/15'}>★</span>
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

/** Punctuality only makes sense for services that happen at a set time. */
const PUNCTUALITY_SERVICES = ['dog_walking', 'drop_in_visit'];

export function ReviewForm({
  bookingId,
  revieweeId,
  revieweeLabel,
  serviceType,
}: {
  bookingId: string;
  revieweeId: string;
  revieweeLabel: string;
  serviceType: string;
}) {
  const action = submitReviewAction.bind(null, bookingId, revieweeId);
  const [state, formAction] = useActionState(action, INITIAL);
  const [rating, setRating] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [petCare, setPetCare] = useState(0);
  const showPunctuality = PUNCTUALITY_SERVICES.includes(serviceType);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[17px] font-semibold text-espresso-700">Overall — rate {revieweeLabel}</p>
        <Stars name="rating" value={rating} onChange={setRating} label="Overall" />
      </div>

      <div className="space-y-2 rounded-2xl bg-bone p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-olive-500">
          Rate each part (optional)
        </p>
        {showPunctuality && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[16px] text-espresso-700">Punctuality</span>
            <Stars
              name="punctuality"
              value={punctuality}
              onChange={setPunctuality}
              label="Punctuality"
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[16px] text-espresso-700">Communication</span>
          <Stars
            name="communication"
            value={communication}
            onChange={setCommunication}
            label="Communication"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[16px] text-espresso-700">Pet care</span>
          <Stars name="petCare" value={petCare} onChange={setPetCare} label="Pet care" />
        </div>
      </div>

      <Textarea name="body" placeholder="Optional — what should other Havenr users know?" />
      <Submit />
    </form>
  );
}
