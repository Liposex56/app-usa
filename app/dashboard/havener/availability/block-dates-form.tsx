'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Field, FormError, Input, Textarea } from '@/components/ui/field';

import { blockDatesAction, type ActionState } from './actions';

const INITIAL: ActionState = { error: null };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Blocking…' : 'Block these dates'}
    </Button>
  );
}

export function BlockDatesForm() {
  const [state, formAction] = useActionState(blockDatesAction, INITIAL);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" htmlFor="startDate" required>
          <Input id="startDate" name="startDate" type="date" required min={today} />
        </Field>
        <Field label="To" htmlFor="endDate" hint="Leave empty for a single day.">
          <Input id="endDate" name="endDate" type="date" min={today} />
        </Field>
      </div>
      <Field label="Reason (optional, only visible to you)" htmlFor="note">
        <Textarea id="note" name="note" placeholder="Vacation, doctor’s appointment…" rows={2} />
      </Field>
      <Submit />
    </form>
  );
}
