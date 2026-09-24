'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import type { MeetGreetRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';

import {
  cancelMeetGreetAction,
  proposeMeetGreetAction,
  respondMeetGreetAction,
  type MeetGreetState,
} from '../actions';

const INITIAL_PROPOSE: MeetGreetState = { error: null, meetGreet: null };

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ProposeForm({
  bookingId,
  onProposed,
}: {
  bookingId: string;
  onProposed: (row: MeetGreetRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const action = async (prev: MeetGreetState, formData: FormData) => {
    const result = await proposeMeetGreetAction(bookingId, prev, formData);
    if (result.meetGreet) {
      onProposed(result.meetGreet);
      setOpen(false);
    }
    return result;
  };
  const [state, formAction] = useActionState(action, INITIAL_PROPOSE);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl border border-espresso-700/8 bg-bone px-4 py-3 text-left text-sm font-medium text-espresso-700 transition-colors hover:border-gold-500/40"
      >
        Propose a Meet &amp; Greet
        <span aria-hidden className="text-espresso-500">
          →
        </span>
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-espresso-700/12 bg-bone p-4"
    >
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-espresso-600">
          Date
          <input
            type="date"
            name="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-lg border border-espresso-700/15 bg-white p-2 text-sm text-espresso-700 focus:border-gold-500 focus:outline-none"
          />
        </label>
        <label className="block text-xs font-medium text-espresso-600">
          Time
          <input
            type="time"
            name="time"
            required
            className="mt-1 w-full rounded-lg border border-espresso-700/15 bg-white p-2 text-sm text-espresso-700 focus:border-gold-500 focus:outline-none"
          />
        </label>
      </div>
      <label className="block text-xs font-medium text-espresso-600">
        Where (optional)
        <input
          type="text"
          name="locationNote"
          placeholder="Your place, a nearby park…"
          className="mt-1 w-full rounded-lg border border-espresso-700/15 bg-white p-2 text-sm text-espresso-700 placeholder:text-espresso-700/35 focus:border-gold-500 focus:outline-none"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Send proposal
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Never mind
        </Button>
      </div>
    </form>
  );
}

function MeetGreetCard({
  meetGreet,
  bookingId,
  viewerId,
}: {
  meetGreet: MeetGreetRow;
  bookingId: string;
  viewerId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const isProposer = meetGreet.proposed_by === viewerId;

  const STATUS_COPY: Record<MeetGreetRow['status'], { label: string; tone: string }> = {
    proposed: { label: 'Proposed', tone: 'bg-cream text-olive-600' },
    accepted: { label: 'Confirmed', tone: 'bg-green-100 text-green-800' },
    declined: { label: 'Declined', tone: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Cancelled', tone: 'bg-espresso-700/8 text-espresso-500' },
  };
  const status = STATUS_COPY[meetGreet.status];

  return (
    <div className="rounded-2xl border border-espresso-700/8 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-espresso-700">
            Meet &amp; Greet — {formatWhen(meetGreet.starts_at)}
          </p>
          {meetGreet.location_note && (
            <p className="mt-0.5 text-xs text-espresso-500">
              {meetGreet.location_note}
            </p>
          )}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>
          {status.label}
        </span>
      </div>

      {meetGreet.status === 'proposed' && !isProposer && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void respondMeetGreetAction(bookingId, meetGreet.id, 'accepted');
              })
            }
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void respondMeetGreetAction(bookingId, meetGreet.id, 'declined');
              })
            }
          >
            Decline
          </Button>
        </div>
      )}
      {meetGreet.status === 'proposed' && isProposer && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                void cancelMeetGreetAction(bookingId, meetGreet.id);
              })
            }
          >
            Cancel proposal
          </Button>
        </div>
      )}
    </div>
  );
}

export function MeetGreetPanel({
  bookingId,
  viewerId,
  initialMeetGreets,
}: {
  bookingId: string;
  viewerId: string;
  initialMeetGreets: MeetGreetRow[];
}) {
  const [meetGreets, setMeetGreets] = useState(initialMeetGreets);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      // Same realtime-auth ordering fix as the chat thread — hand the
      // signed-in session's token to the socket before subscribing, or RLS
      // silently drops every row for both participants.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel(`booking-meet-greets-${bookingId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'meet_greets', filter: `booking_id=eq.${bookingId}` },
          (payload) => {
            const row = payload.new as MeetGreetRow;
            setMeetGreets((current) => {
              const exists = current.some((m) => m.id === row.id);
              return exists
                ? current.map((m) => (m.id === row.id ? row : m))
                : [...current, row];
            });
          }
        )
        .subscribe();
    }

    start();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const active = meetGreets
    .filter((m) => m.status !== 'cancelled' && m.status !== 'declined')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div className="space-y-3 p-4">
      {active.map((meetGreet) => (
        <MeetGreetCard
          key={meetGreet.id}
          meetGreet={meetGreet}
          bookingId={bookingId}
          viewerId={viewerId}
        />
      ))}
      <ProposeForm
        bookingId={bookingId}
        onProposed={(row) => setMeetGreets((current) => [...current, row])}
      />
    </div>
  );
}
