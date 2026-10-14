'use client';

import { useActionState, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/field';
import { TimeSelect } from '@/components/ui/time-select';
import { timeLabels } from '@/lib/booking-flow';
import {
  bookAction,
  cancelBookClickAction,
  modifyBookingAction,
  reportBookingAction,
  toggleArchiveAction,
  type ActionState,
} from '../actions';

const INITIAL: ActionState = { error: null };

export type ModifyDefaults = {
  startDate: string;
  endDate: string | null;
  dropoffFrom: string | null;
  dropoffTo: string | null;
  pickupFrom: string | null;
  pickupTo: string | null;
  wantsPickupDropoff: boolean;
  /** Transport only applies when the pet goes to the Havener's home. */
  allowsTransport: boolean;
  /** Boarding, daycare and house sitting run on exact start and end times. */
  timed: boolean;
  serviceType: string;
};

const hhmm = (value: string | null) => value?.slice(0, 5) ?? '';

function SafetyTips({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-espresso-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tips-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-hv-paper p-6 shadow-lift"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tips-title" className="text-lg font-semibold text-espresso-700">
          Tips for a safe stay
        </h2>
        <p className="mt-2 text-sm text-espresso-600">
          Many safety incidents are easily preventable. Here are three easy ways
          to have a great stay every time.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-espresso-600">
          <li>Feed dogs separately to keep meal time safe.</li>
          <li>Give each dog their own hangout space when you’re not home.</li>
          <li>
            Closely supervise play between dogs of different sizes and dogs from
            different households.
          </li>
        </ul>
        <Button type="button" size="md" className="mt-5 w-full" onClick={onConfirm}>
          Got it!
        </Button>
      </div>
    </div>
  );
}

function ModifyPanel({
  bookingId,
  defaults,
  onDone,
}: {
  bookingId: string;
  defaults: ModifyDefaults;
  onDone: () => void;
}) {
  const action = async (prev: ActionState, formData: FormData) => {
    const result = await modifyBookingAction(bookingId, prev, formData);
    if (!result.error) onDone();
    return result;
  };
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const [wantsPickup, setWantsPickup] = useState(defaults.wantsPickupDropoff);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="mt-3 space-y-3 rounded-2xl border border-espresso-700/12 bg-bone p-4"
    >
      <FormError message={state.error} />
      <p className="text-xs text-espresso-500">
        Changing a request means both of you need to click Book again.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date" htmlFor="m-start" required>
          <Input
            id="m-start"
            name="startDate"
            type="date"
            min={today}
            required
            defaultValue={defaults.startDate}
          />
        </Field>
        <Field label="End date" htmlFor="m-end">
          <Input
            id="m-end"
            name="endDate"
            type="date"
            min={today}
            defaultValue={defaults.endDate ?? ''}
          />
        </Field>
      </div>

      {defaults.timed ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={timeLabels(defaults.serviceType).start} htmlFor="m-dropoff" required>
            <TimeSelect
              id="m-dropoff"
              name="dropoffFrom"
              placeholder="Select time"
              required
              defaultValue={hhmm(defaults.dropoffFrom)}
            />
          </Field>
          <Field label={timeLabels(defaults.serviceType).end} htmlFor="m-pickup" required>
            <TimeSelect
              id="m-pickup"
              name="pickupFrom"
              placeholder="Select time"
              required
              defaultValue={hhmm(defaults.pickupFrom)}
            />
          </Field>
        </div>
      ) : (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold uppercase tracking-[0.06em] text-espresso-700">
            Preferred time
          </legend>
          <div className="flex items-center gap-2">
            <TimeSelect
              name="dropoffFrom"
              aria-label="Preferred time from"
              placeholder="Any time"
              defaultValue={hhmm(defaults.dropoffFrom)}
            />
            <span className="text-xs text-espresso-500">to</span>
            <TimeSelect
              name="dropoffTo"
              aria-label="Preferred time until"
              placeholder="Any time"
              defaultValue={hhmm(defaults.dropoffTo)}
            />
          </div>
        </fieldset>
      )}

      {defaults.allowsTransport && (
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-espresso-700/12 bg-hv-paper px-4 py-3 text-sm text-espresso-700">
          Sitter pick-up and drop-off
          <input
            type="checkbox"
            name="wantsPickupDropoff"
            checked={wantsPickup}
            onChange={(event) => setWantsPickup(event.target.checked)}
            className="h-5 w-5 accent-gold-500"
          />
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

function ReportPanel({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [sent, setSent] = useState(false);
  const action = async (prev: ActionState, formData: FormData) => {
    const result = await reportBookingAction(bookingId, prev, formData);
    if (!result.error) setSent(true);
    return result;
  };
  const [state, formAction, pending] = useActionState(action, INITIAL);

  if (sent) {
    return (
      <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
        Thanks — our team will review this conversation.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-3 space-y-2 rounded-2xl border border-espresso-700/12 bg-bone p-4"
    >
      <FormError message={state.error} />
      <label className="block text-sm font-medium text-espresso-700">
        What would you like to report?
        <textarea
          name="reason"
          required
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-lg border border-espresso-700/15 bg-hv-paper p-2.5 text-sm text-espresso-700 focus:border-gold-500 focus:outline-none"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="dark" disabled={pending}>
          {pending ? 'Sending…' : 'Send report'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

/**
 * The booking's actions, split across the page: `book` (Book, Cancel request,
 * Modify request — under the request details) and `chat` (Archive, Report —
 * in the conversation's header). Each part keeps its own panels.
 */
export function BookingToolbar({
  parts,
  bookingId,
  viewerRole,
  status,
  ownerBooked,
  sitterBooked,
  archived,
  modifyDefaults,
}: {
  parts: 'book' | 'chat';
  bookingId: string;
  viewerRole: 'owner' | 'sitter';
  status: string;
  ownerBooked: boolean;
  sitterBooked: boolean;
  archived: boolean;
  modifyDefaults: ModifyDefaults;
}) {
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<'modify' | 'report' | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const open = status === 'requested';
  const iHaveBooked = viewerRole === 'owner' ? ownerBooked : sitterBooked;

  function runBook() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await bookAction(bookingId);
      setError(result.error);
      setNotice(result.notice);
    });
  }

  function onBookClick() {
    // The Havener sees safety tips first, then the booking goes through.
    if (viewerRole === 'sitter') setShowTips(true);
    else runBook();
  }

  if (parts === 'chat') {
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await toggleArchiveAction(bookingId);
                setError(result.error);
              })
            }
          >
            {archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPanel(panel === 'report' ? null : 'report')}
          >
            Report
          </Button>
        </div>

        {error && (
          <p role="alert" className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl bg-red-50 p-3 text-sm text-red-800 shadow-lift">
            {error}
          </p>
        )}

        {panel === 'report' && (
          <div className="absolute right-0 top-full z-30 mt-2 w-[min(24rem,calc(100vw-2.5rem))] rounded-2xl shadow-lift">
            <ReportPanel bookingId={bookingId} onDone={() => setPanel(null)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-2">
        {open && !iHaveBooked && (
          <Button size="lg" className="w-full" disabled={isPending} onClick={onBookClick}>
            {isPending ? 'Booking…' : 'Book'}
          </Button>
        )}
        {open && iHaveBooked && viewerRole === 'sitter' && (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelBookClickAction(bookingId);
                setError(result.error);
              })
            }
          >
            Cancel request
          </Button>
        )}
        {open && iHaveBooked && viewerRole === 'owner' && (
          <p className="rounded-full bg-green-100 px-4 py-2.5 text-center text-[17px] font-semibold text-green-800">
            You’ve booked — waiting on the Havener
          </p>
        )}

        {open && (
          <Button
            size="lg"
            variant="secondary"
            className="w-full"
            onClick={() => setPanel(panel === 'modify' ? null : 'modify')}
          >
            Modify request
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && <p className="mt-2 text-sm text-olive-600">{notice}</p>}

      {panel === 'modify' && open && (
        <ModifyPanel
          bookingId={bookingId}
          defaults={modifyDefaults}
          onDone={() => setPanel(null)}
        />
      )}

      {showTips && (
        <SafetyTips
          onClose={() => setShowTips(false)}
          onConfirm={() => {
            setShowTips(false);
            runBook();
          }}
        />
      )}
    </div>
  );
}
