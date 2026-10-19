'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { formatDate } from '@/lib/utils';

import { addHolidayAction, removeHolidayAction, type SettingsState } from './actions';

const INITIAL: SettingsState = { error: null };

/**
 * Holidays: a stay that touches one is charged at the Havener's holiday rate
 * for the whole stay. The list starts with the usual peak days.
 */
export function HolidaysPanel({
  holidays,
}: {
  holidays: Array<{ day: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(addHolidayAction, INITIAL);

  return (
    <div className="space-y-4 rounded-2xl border border-espresso-700/10 bg-hv-paper p-6">
      <div>
        <h2 className="font-semibold text-espresso-700">Holidays</h2>
        <p className="mt-1 text-sm text-espresso-500">
          A stay that includes any of these days is charged at the Havener’s
          holiday rate for the whole stay. Add or remove days as needed.
        </p>
      </div>

      <form action={formAction} className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field label="Date" htmlFor="holiday-day">
          <Input id="holiday-day" name="day" type="date" required />
        </Field>
        <Field label="Name" htmlFor="holiday-name">
          <Input id="holiday-name" name="name" maxLength={60} required placeholder="Presidents’ Day" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </form>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}

      <ul className="max-h-72 divide-y divide-espresso-700/8 overflow-y-auto">
        {holidays.map((holiday) => (
          <li key={holiday.day} className="flex items-center justify-between gap-3 py-2 text-[17px]">
            <span className="text-espresso-700">
              <span className="font-semibold">{holiday.name}</span> · {formatDate(holiday.day)}
            </span>
            <form action={removeHolidayAction}>
              <input type="hidden" name="day" value={holiday.day} />
              <button
                type="submit"
                className="text-sm font-semibold text-red-700 hover:underline"
                aria-label={`Remove ${holiday.name} ${holiday.day}`}
              >
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
