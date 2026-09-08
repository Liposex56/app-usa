import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { BookingCounterparty, BookingRow, BookingStatus } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Booking requests' };

const STATUS_LABEL: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: 'New request', tone: 'bg-cream text-olive-600' },
  confirmed: { label: 'Confirmed', tone: 'bg-green-100 text-green-800' },
  in_progress: { label: 'In progress', tone: 'bg-sky-100 text-sky-700' },
  completed: { label: 'Completed', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_payout: { label: 'Completed', tone: 'bg-espresso-700/8 text-espresso-600' },
  paid_out: { label: 'Completed', tone: 'bg-espresso-700/8 text-espresso-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-red-100 text-red-800' },
  declined: { label: 'Declined', tone: 'bg-red-100 text-red-800' },
  disputed: { label: 'In dispute', tone: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', tone: 'bg-red-100 text-red-800' },
};

export default async function HavenerBookingsPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('sitter_id', profile.id)
    .order('created_at', { ascending: false });

  const bookings = (data ?? []) as BookingRow[];

  const owners = await Promise.all(
    bookings.map(async (booking) => {
      const { data: counterparty } = await supabase.rpc('booking_counterparty', {
        p_booking_id: booking.id,
      });
      return [booking.id, (counterparty as BookingCounterparty[] | null)?.[0]] as const;
    })
  );
  const ownerById = new Map(owners);

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-6 text-3xl">Booking requests</h1>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          No booking requests yet.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_LABEL[booking.status];
            const owner = ownerById.get(booking.id);
            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-espresso-700/8 bg-white p-5 shadow-card transition-colors hover:border-gold-500/40"
              >
                <div>
                  <p className="font-medium text-espresso-700">
                    {serviceName(booking.service_type)} for{' '}
                    {owner?.display_name ?? 'a pet owner'}
                  </p>
                  <p className="mt-1 text-sm text-espresso-500">
                    {formatDate(booking.start_date)}
                    {booking.end_date ? ` – ${formatDate(booking.end_date)}` : ''}
                    {' · '}
                    you earn {formatCents(booking.sitter_payout_cents)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}
                >
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
