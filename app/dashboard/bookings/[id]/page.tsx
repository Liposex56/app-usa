import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type {
  BookingCounterparty,
  BookingRow,
  MeetGreetRow,
  MessageRow,
  PetRow,
  ReviewRow,
  WalkLocationRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

import { sendMessageAction } from '../actions';
import { BookingActions } from './booking-actions';
import { CallWindow } from './call-window';
import { Chat } from './chat';
import { MeetGreetPanel } from './meet-greet';
import { PayButton } from './pay-button';
import { ReviewForm } from './review-form';
import { WalkMap } from './walk-map';
import { WalkTracker } from './walk-tracker';

export const metadata: Metadata = { title: 'Booking' };

const STATUS_LABEL: Record<string, string> = {
  requested: 'Waiting on the Havener to respond',
  confirmed: 'Confirmed',
  in_progress: 'Service in progress',
  completed: 'Completed',
  pending_payout: 'Completed — payout pending',
  paid_out: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
  disputed: 'In dispute',
  refunded: 'Refunded',
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!bookingRow) notFound();
  const booking = bookingRow as BookingRow;

  const viewerRole: 'owner' | 'sitter' =
    booking.owner_id === profile.id ? 'owner' : 'sitter';

  const [
    { data: counterpartyRows },
    { data: petLinks },
    { data: messageRows },
    { data: reviewRows },
    { data: meetGreetRows },
    { data: walkLocationRows },
  ] = await Promise.all([
    supabase.rpc('booking_counterparty', { p_booking_id: id }),
    supabase.from('booking_pets').select('pet_id').eq('booking_id', id),
    supabase
      .from('messages')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('reviews').select('*').eq('booking_id', id),
    supabase
      .from('meet_greets')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true }),
    booking.service_type === 'dog_walking'
      ? supabase
          .from('walk_locations')
          .select('*')
          .eq('booking_id', id)
          .order('recorded_at', { ascending: true })
      : Promise.resolve({ data: [] as WalkLocationRow[] }),
  ]);

  const counterparty = (counterpartyRows as BookingCounterparty[] | null)?.[0] ?? null;
  const petIds = (petLinks ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = petIds.length
    ? await supabase.from('pets').select('*').in('id', petIds)
    : { data: [] as PetRow[] };
  const pets = (petRows ?? []) as PetRow[];
  const messages = (messageRows ?? []) as MessageRow[];
  const reviews = (reviewRows ?? []) as ReviewRow[];
  const meetGreets = (meetGreetRows ?? []) as MeetGreetRow[];
  const walkLocations = (walkLocationRows ?? []) as WalkLocationRow[];
  const myReview = reviews.find((r) => r.reviewer_id === profile.id);
  const counterpartyId = viewerRole === 'owner' ? booking.sitter_id : booking.owner_id;

  const backHref =
    viewerRole === 'owner' ? '/dashboard/bookings' : '/dashboard/havener/bookings';

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to bookings
      </Link>

      {/* Compact header — just who, what, and the status. All the "boarding
          data" (dates, pets, price, payment, cancel/decline reasons) lives
          behind the "View details" toggle below instead of dominating the
          page above the chat. */}
      <div className="mt-6 rounded-3xl border border-espresso-700/8 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-sky-100">
              {counterparty?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={counterparty.avatar_url}
                  alt={counterparty.display_name ?? ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base font-medium text-espresso-500">
                  {(counterparty?.display_name ?? '—').slice(0, 1)}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-espresso-700">
                {viewerRole === 'sitter' ? (
                  <Link
                    href={`/dashboard/bookings/${booking.id}/owner`}
                    className="hover:underline"
                  >
                    {counterparty?.display_name ?? '—'}
                  </Link>
                ) : (
                  counterparty?.display_name ?? '—'
                )}
              </p>
              <p className="text-xs text-espresso-500">
                {serviceName(booking.service_type)}
              </p>
            </div>
          </div>
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-olive-600">
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <details className="group mt-4 border-t border-espresso-700/8 pt-3">
          <summary className="cursor-pointer list-none text-sm font-medium text-gold-600 hover:text-gold-700">
            <span className="group-open:hidden">View details</span>
            <span className="hidden group-open:inline">Hide details</span>
          </summary>

          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                Dates
              </dt>
              <dd className="mt-1 text-espresso-700">
                {formatDate(booking.start_date)}
                {booking.end_date ? ` – ${formatDate(booking.end_date)}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                Pets
              </dt>
              <dd className="mt-1 text-espresso-700">
                {pets.map((p) => p.name).join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                Total
              </dt>
              <dd className="mt-1 text-espresso-700">
                {formatCents(booking.total_cents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                {viewerRole === 'sitter' ? 'You earn' : 'Platform fee'}
              </dt>
              <dd className="mt-1 text-espresso-700">
                {viewerRole === 'sitter'
                  ? formatCents(booking.sitter_payout_cents)
                  : formatCents(booking.platform_fee_cents)}
              </dd>
            </div>
          </dl>

          {booking.owner_notes && (
            <p className="mt-4 rounded-xl bg-bone p-4 text-sm text-espresso-600">
              &ldquo;{booking.owner_notes}&rdquo;
            </p>
          )}
          {booking.decline_reason && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              Declined: {booking.decline_reason}
            </p>
          )}
          {booking.cancellation_reason && (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
              Cancelled: {booking.cancellation_reason}
            </p>
          )}

          {viewerRole === 'owner' &&
            booking.payment_status !== 'paid' &&
            ['confirmed', 'in_progress', 'completed'].includes(booking.status) && (
              <div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-50 p-4">
                <p className="text-sm text-espresso-700">
                  {booking.payment_status === 'processing'
                    ? 'Payment is processing…'
                    : 'This booking is confirmed but not paid yet.'}
                </p>
                {booking.payment_status !== 'processing' && (
                  <div className="mt-3">
                    <PayButton bookingId={booking.id} totalCents={booking.total_cents} />
                  </div>
                )}
              </div>
            )}
          {viewerRole === 'owner' && booking.payment_status === 'paid' && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
              Paid
            </p>
          )}

          <div className="mt-5 border-t border-espresso-700/8 pt-5">
            <CallWindow
              bookingId={booking.id}
              counterpartyName={counterparty?.display_name ?? 'them'}
              initialValue={booking.call_window}
            />
          </div>
        </details>

        <div className="mt-4 border-t border-espresso-700/8 pt-4">
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            viewerRole={viewerRole}
          />
        </div>
      </div>

      {booking.service_type === 'dog_walking' &&
        (booking.status === 'in_progress' || walkLocations.length > 0) && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg text-espresso-700">Walk route</h2>
            {viewerRole === 'sitter' && booking.status === 'in_progress' && (
              <WalkTracker bookingId={booking.id} />
            )}
            <WalkMap
              bookingId={booking.id}
              initialLocations={walkLocations}
              live={booking.status === 'in_progress'}
            />
          </div>
        )}

      <div className="mt-6">
        <Chat
          bookingId={booking.id}
          viewerId={profile.id}
          initialMessages={messages}
          sendAction={sendMessageAction.bind(null, booking.id, counterpartyId)}
          counterpartyName={counterparty?.display_name ?? 'them'}
          counterpartyAvatarUrl={counterparty?.avatar_url ?? null}
        />
      </div>

      <div className="mt-3 rounded-3xl border border-espresso-700/8 bg-white shadow-card">
        <MeetGreetPanel
          bookingId={booking.id}
          viewerId={profile.id}
          initialMeetGreets={meetGreets}
        />
      </div>

      {booking.status === 'completed' && (
        <div className="mt-8 rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card">
          <h2 className="text-lg text-espresso-700">Review</h2>
          {myReview ? (
            <p className="mt-2 text-sm text-espresso-500">
              You submitted your review.{' '}
              {myReview.published_at
                ? 'Both reviews are now visible.'
                : 'It will publish once the other side reviews too.'}
            </p>
          ) : (
            <div className="mt-4">
              <ReviewForm
                bookingId={booking.id}
                revieweeId={counterpartyId}
                revieweeLabel={counterparty?.display_name ?? 'them'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
