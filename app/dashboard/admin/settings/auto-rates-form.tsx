'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

import { updateAutoRatesAction, type SettingsState } from './actions';

const INITIAL: SettingsState = { error: null };

export type AutoRateDefaults = {
  holiday: number | null;
  additionalPet: number | null;
  extendedStay: number | null;
};

/**
 * The percentages behind a Havener's "Use Havenr's automatic rates" switch.
 * Empty = not set: Haveners can't switch it on until all three are set.
 */
export function AutoRatesForm({
  defaults,
  canEdit,
}: {
  defaults: AutoRateDefaults;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateAutoRatesAction, INITIAL);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-espresso-700/10 bg-hv-paper p-6"
    >
      <div>
        <h2 className="font-semibold text-espresso-700">Automatic rates</h2>
        <p className="mt-1 text-sm text-espresso-500">
          A Havener who switches this on gets these three rates worked out from
          their own rate (rounded to whole dollars). Leave one empty and the
          switch stays unavailable until all three are set.
        </p>
      </div>

      <Field
        label="Holiday — added to the rate (%)"
        htmlFor="holidayPercent"
        hint="25 means a $50 rate becomes $63 on a holiday stay."
      >
        <Input
          id="holidayPercent"
          name="holidayPercent"
          type="number"
          min={0}
          max={500}
          step="0.5"
          defaultValue={defaults.holiday ?? ''}
          disabled={!canEdit}
        />
      </Field>
      <Field
        label="Additional pet — share of the rate (%)"
        htmlFor="additionalPetPercent"
        hint="50 means a second pet adds half of the rate per night / day."
      >
        <Input
          id="additionalPetPercent"
          name="additionalPetPercent"
          type="number"
          min={0}
          max={200}
          step="0.5"
          defaultValue={defaults.additionalPet ?? ''}
          disabled={!canEdit}
        />
      </Field>
      <Field
        label="Extended stay (more than one day) — change to the rate (%)"
        htmlFor="extendedStayPercent"
        hint="-10 is a 10% discount per night; 0 keeps the rate."
      >
        <Input
          id="extendedStayPercent"
          name="extendedStayPercent"
          type="number"
          min={-90}
          max={200}
          step="0.5"
          defaultValue={defaults.extendedStay ?? ''}
          disabled={!canEdit}
        />
      </Field>

      {!canEdit && (
        <p className="text-xs text-espresso-500/70">
          Only an administrator can change these values.
        </p>
      )}
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.saved && !state.error && <p className="text-sm text-green-700">Saved.</p>}

      <Button type="submit" disabled={!canEdit || pending}>
        {pending ? 'Saving…' : 'Save automatic rates'}
      </Button>
    </form>
  );
}
