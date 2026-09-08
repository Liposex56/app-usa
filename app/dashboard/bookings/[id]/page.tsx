import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type {
  BookingCounterparty,
  BookingRow,
  MessageRow,
  PetRow,
  ReviewRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

import { sendMessageAction } from '../actions';
import { BookingActions } from './booking-actions';
import { Chat } from './chat';
import { ReviewForm } from './review-form';

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

  const [{ data: counterpartyRows }, { data: petLinks }, { data: messageRows }, { data: reviewRows }] =
    await Promise.all([
      supabase.rpc('booking_counterparty', { p_booking_id: id }),
      supabase.from('booking_pets').select('pet_id').eq('booking_id', id),
      supabase
        .from('messages')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: true }),
      supabase.from('reviews').select('*').eq('booking_id', id),
    ]);

  const counterparty = (counterpartyRows as BookingCounterparty[] | null)?.[0] ?? null;
  const petIds = (petLinks ?? []).map((row) => row.pet_id as string);
  const { data: petRows } = petIds.length
    ? await supabase.from('pets').select('*').in('id', petIds)
    : { data: [] as PetRow[] };
  const pets = (petRows ?? []) as PetRow[];
  const messages = (messageRows ?? []) as MessageRow[];
  const reviews = (reviewRows ?? []) as ReviewRow[];
  const myReview = reviews.find((r) => r.reviewer_id === profile.id);
  const counterpartyId = viewerRole === 'owner' ? booking.sitter_id : booking.owner_id;

  const backHref =
    viewerRole === 'owner' ? '/dashboard/bookings' : '/dashboard/havener/bookings';

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to bookings
      </Link>

      <div className="mt-6 rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl text-espresso-700">
              {serviceName(booking.service_type)}
            </h1>
            <p className="mt-1 text-sm text-espresso-500">
              with {counterparty?.display_name ?? '—'}
            </p>
          </div>
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-olive-600">
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-espresso-700/8 pt-5 text-sm sm:grid-cols-2">
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

        <div className="mt-5 border-t border-espresso-700/8 pt-5">
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            viewerRole={viewerRole}
          />
        </div>
      </div>

      <h2 className="mt-8 text-lg text-espresso-700">Messages</h2>
      <div className="mt-3">
        <Chat
          bookingId={booking.id}
          viewerId={profile.id}
          initialMessages={messages}
          sendAction={sendMessageAction.bind(null, booking.id, counterpartyId)}
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
