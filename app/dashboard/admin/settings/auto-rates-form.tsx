'use client';

import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

import { updateAutoRatesAction, type SettingsState } from './actions';

const INITIAL: SettingsState = { error: null };

export type AutoRateDefaults = {
  stayHoliday: number | null;
  stayExtended: number | null;
  stayExtendedMinUnits: number | null;
  stayPuppy: number | null;
  /** In dollars. */
  stayAdditionalLess: number | null;
  visitSixty: number | null;
  visitAdditionalLess: number | null;
  visitPuppy: number | null;
  houseAdditionalLess: number | null;
  visitHoliday: number | null;
  visitCatLess: number | null;
};

/**
 * The rules behind a Havener's "Use Havenr's automatic rates" switch, one set
 * for stays and one for walks and visits. Empty = not set: Haveners can't
 * switch it on until every value is set.
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
      className="space-y-5 rounded-2xl border border-espresso-700/10 bg-hv-paper p-6"
    >
      <div>
        <h2 className="font-semibold text-espresso-700">Automatic rates</h2>
        <p className="mt-1 text-sm text-espresso-500">
          A Havener who switches this on gets these rates worked out from their own
          rate, rounded to whole dollars. Leave one empty and the switch stays
          unavailable until every value is set.
        </p>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-[0.06em] text-espresso-700">
          Boarding, daycare and house sitting
        </legend>
        <Field
          label="Holiday — added to the rate (%)"
          htmlFor="stayHolidayPercent"
          hint="20 means a $50 rate becomes $60 in a holiday period. A puppy’s rate goes up first, then the holiday on top of it. The additional-dog rate goes up by the same percentage."
        >
          <Input
            id="stayHolidayPercent"
            name="stayHolidayPercent"
            type="number"
            min={0}
            max={500}
            step="0.5"
            defaultValue={defaults.stayHoliday ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Extended stay — change to the rate (%)"
          htmlFor="stayExtendedPercent"
          hint="0 keeps the regular rate (how it starts). -5 would be a 5% discount per night. It does not apply in a holiday period."
        >
          <Input
            id="stayExtendedPercent"
            name="stayExtendedPercent"
            type="number"
            min={-90}
            max={200}
            step="0.5"
            defaultValue={defaults.stayExtended ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Extended stay — from how many nights (or days)"
          htmlFor="stayExtendedMinUnits"
          hint="3 means stays of 3 nights or more."
        >
          <Input
            id="stayExtendedMinUnits"
            name="stayExtendedMinUnits"
            type="number"
            min={2}
            max={60}
            step="1"
            defaultValue={defaults.stayExtendedMinUnits ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Puppy — added to the rate (%)"
          htmlFor="stayPuppyPercent"
          hint="10 means a $50 rate becomes $55 when the stay includes a puppy (a dog under one year)."
        >
          <Input
            id="stayPuppyPercent"
            name="stayPuppyPercent"
            type="number"
            min={0}
            max={200}
            step="0.5"
            defaultValue={defaults.stayPuppy ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Additional dog, boarding and daycare — dollars less than the rate (USD)"
          htmlFor="stayAdditionalLess"
          hint="10 means a second dog pays $10 less than the regular rate, per night."
        >
          <Input
            id="stayAdditionalLess"
            name="stayAdditionalLess"
            type="number"
            min={0}
            max={1000}
            step="1"
            defaultValue={defaults.stayAdditionalLess ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Additional dog, house sitting — less than the rate (%)"
          htmlFor="houseAdditionalLessPercent"
          hint="50 means a second dog pays half of the rate, per night."
        >
          <Input
            id="houseAdditionalLessPercent"
            name="houseAdditionalLessPercent"
            type="number"
            min={0}
            max={100}
            step="0.5"
            defaultValue={defaults.houseAdditionalLess ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <p className="text-sm text-espresso-500">
          Extended care (boarding and house sitting) is fixed: a pick-up more than 2
          hours later in the day than the drop-off adds 50% of a night (2–8 hours) or
          100% (8 hours or more), for every pet.
        </p>
      </fieldset>

      <fieldset className="space-y-4 border-t border-espresso-700/10 pt-5">
        <legend className="text-sm font-semibold uppercase tracking-[0.06em] text-espresso-700">
          Walks and drop-in visits
        </legend>
        <Field
          label="60 minutes — added to the 30-minute rate (%)"
          htmlFor="visitSixtyPercent"
          hint="50 means a $20 walk of 30 minutes is $30 for 60 minutes."
        >
          <Input
            id="visitSixtyPercent"
            name="visitSixtyPercent"
            type="number"
            min={0}
            max={500}
            step="0.5"
            defaultValue={defaults.visitSixty ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Additional dog — less than the rate (%)"
          htmlFor="visitAdditionalLessPercent"
          hint="40 means a second dog pays 60% of the rate."
        >
          <Input
            id="visitAdditionalLessPercent"
            name="visitAdditionalLessPercent"
            type="number"
            min={0}
            max={100}
            step="0.5"
            defaultValue={defaults.visitAdditionalLess ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Puppy — added to the rate (%)"
          htmlFor="visitPuppyPercent"
          hint="10 means a puppy visit costs 10% more."
        >
          <Input
            id="visitPuppyPercent"
            name="visitPuppyPercent"
            type="number"
            min={0}
            max={200}
            step="0.5"
            defaultValue={defaults.visitPuppy ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Holiday — added to the rate (%)"
          htmlFor="visitHolidayPercent"
          hint="20 means a $20 walk is $24 in a holiday period. The additional-dog rate goes up too."
        >
          <Input
            id="visitHolidayPercent"
            name="visitHolidayPercent"
            type="number"
            min={0}
            max={500}
            step="0.5"
            defaultValue={defaults.visitHoliday ?? ''}
            disabled={!canEdit}
          />
        </Field>
        <Field
          label="Cats on drop-in visits — less than the rate (%)"
          htmlFor="visitCatLessPercent"
          hint="10 means a drop-in visit for cats costs 10% less than the regular rate."
        >
          <Input
            id="visitCatLessPercent"
            name="visitCatLessPercent"
            type="number"
            min={0}
            max={100}
            step="0.5"
            defaultValue={defaults.visitCatLess ?? ''}
            disabled={!canEdit}
          />
        </Field>
      </fieldset>

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
