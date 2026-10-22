'use client';

import { useState, useTransition } from 'react';

import { TIP_PERCENTS, tipCents } from '@/lib/tips';
import { formatCents } from '@/lib/utils';

import { createTipCheckoutAction } from './tip-actions';

/** "Would you like to tip your Havener?" with the exact amount on each button. */
export function TipForm({ bookingId, totalCents }: { bookingId: string; totalCents: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<number | null>(null);

  function choose(percent: number) {
    setError(null);
    setChosen(percent);
    startTransition(async () => {
      const result = await createTipCheckoutAction(bookingId, percent);
      // On success the action redirects to Stripe; only an error comes back.
      if (result?.error) {
        setError(result.error);
        setChosen(null);
      }
    });
  }

  return (
    <div className="mt-5 border-t border-espresso-700/8 pt-5">
      <h3 className="text-lg font-semibold text-espresso-700">Leave a tip for your Havener?</h3>
      <p className="mt-1 text-[16px] text-espresso-500">
        100% goes to them. Optional — pick an amount, or skip it.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIP_PERCENTS.map((percent) => (
          <button
            key={percent}
            type="button"
            disabled={pending}
            onClick={() => choose(percent)}
            className="rounded-2xl border border-hv-ink/20 bg-hv-paper px-3 py-3 text-center transition-colors hover:border-hv-ink hover:bg-hv-butter disabled:opacity-60"
          >
            <span className="block text-xl font-bold text-espresso-700">{percent}%</span>
            <span className="block text-[16px] text-espresso-600">
              {pending && chosen === percent
                ? 'Opening…'
                : formatCents(tipCents(totalCents, percent))}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
