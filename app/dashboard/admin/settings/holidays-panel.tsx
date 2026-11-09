'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { formatDate } from '@/lib/utils';

import {
  addHolidayPeriodAction,
  removeHolidayPeriodAction,
  updateHolidayPeriodAction,
  type SettingsState,
} from './actions';

const INITIAL: SettingsState = { error: null };

export type HolidayPeriod = {
  id: string;
  name: string;
  year: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
};

const day = (value: string) => value.slice(0, 10);
const time = (value: string) => value.slice(11, 16);

function PeriodFields({ period }: { period?: HolidayPeriod }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Name" htmlFor={`name-${period?.id ?? 'new'}`}>
          <Input
            id={`name-${period?.id ?? 'new'}`}
            name="name"
            maxLength={80}
            required
            placeholder="Thanksgiving"
            defaultValue={period?.name}
          />
        </Field>
      </div>
      <Field label="Starts" htmlFor={`start-${period?.id ?? 'new'}`}>
        <Input
          id={`start-${period?.id ?? 'new'}`}
          name="startDate"
          type="date"
          required
          defaultValue={period ? day(period.starts_at) : undefined}
        />
      </Field>
      <Field label="Start time" htmlFor={`stime-${period?.id ?? 'new'}`}>
        <Input
          id={`stime-${period?.id ?? 'new'}`}
          name="startTime"
          type="time"
          defaultValue={period ? time(period.starts_at) : '00:00'}
        />
      </Field>
      <Field label="Ends" htmlFor={`end-${period?.id ?? 'new'}`}>
        <Input
          id={`end-${period?.id ?? 'new'}`}
          name="endDate"
          type="date"
          required
          defaultValue={period ? day(period.ends_at) : undefined}
        />
      </Field>
      <Field label="End time" htmlFor={`etime-${period?.id ?? 'new'}`}>
        <Input
          id={`etime-${period?.id ?? 'new'}`}
          name="endTime"
          type="time"
          defaultValue={period ? time(period.ends_at) : '23:59'}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-espresso-700 sm:col-span-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={period?.active ?? true}
          className="accent-[#26100B]"
        />
        Active (the holiday rate applies)
      </label>
    </div>
  );
}

function PeriodRow({ period }: { period: HolidayPeriod }) {
  const [state, formAction, pending] = useActionState(updateHolidayPeriodAction, INITIAL);
  const sameDay = day(period.starts_at) === day(period.ends_at);

  return (
    <li className="py-2.5">
      <details>
        <summary className="flex cursor-pointer items-center justify-between gap-3 text-[17px]">
          <span className="text-espresso-700">
            <span className="font-semibold">{period.name}</span> · {formatDate(day(period.starts_at))}
            {sameDay ? '' : ` – ${formatDate(day(period.ends_at))}`}
          </span>
          {!period.active && (
            <span className="rounded-full bg-espresso-700/8 px-2.5 py-0.5 text-xs font-semibold text-espresso-600">
              Off
            </span>
          )}
        </summary>

        <div className="mt-3 space-y-3 rounded-xl bg-bone p-4">
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="id" value={period.id} />
            <PeriodFields period={period} />
            {state.error && <p className="text-sm text-red-700">{state.error}</p>}
            {state.saved && !state.error && <p className="text-sm text-green-700">Saved.</p>}
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </form>
          <form action={removeHolidayPeriodAction}>
            <input type="hidden" name="id" value={period.id} />
            <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">
              Remove this holiday
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}

/**
 * Holiday periods: a booking that touches any active period is charged the
 * holiday rate once, for the whole booking. The exact dates can change every
 * year, so each period is edited here.
 */
export function HolidaysPanel({ periods }: { periods: HolidayPeriod[] }) {
  const [state, formAction, pending] = useActionState(addHolidayPeriodAction, INITIAL);

  return (
    <div className="space-y-4 rounded-2xl border border-espresso-700/10 bg-hv-paper p-6">
      <div>
        <h2 className="font-semibold text-espresso-700">Holiday periods</h2>
        <p className="mt-1 text-sm text-espresso-500">
          A booking with at least one day inside an active period is charged the
          holiday rate for the whole booking — once, even if it touches two periods
          (Christmas and New Year). Open a period to change its dates or turn it off.
        </p>
      </div>

      <details className="rounded-xl border border-espresso-700/10 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-espresso-700">
          Add a holiday period
        </summary>
        <form action={formAction} className="mt-4 space-y-3">
          <PeriodFields />
          {state.error && <p className="text-sm text-red-700">{state.error}</p>}
          {state.saved && !state.error && <p className="text-sm text-green-700">Added.</p>}
          <Button type="submit" disabled={pending}>
            {pending ? 'Adding…' : 'Add'}
          </Button>
        </form>
      </details>

      <ul className="max-h-[32rem] divide-y divide-espresso-700/8 overflow-y-auto">
        {periods.map((period) => (
          <PeriodRow key={period.id} period={period} />
        ))}
      </ul>
    </div>
  );
}
