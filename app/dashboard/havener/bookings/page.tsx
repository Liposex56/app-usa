import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { BookingCounterparty, BookingRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { bookingPhase } from '@/lib/booking-phase';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Bookings' };

export default async function HavenerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');
  const showArchived = (await searchParams).archived === '1';

  const supabase = await createClient();
  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('sitter_id', profile.id)
    .eq('archived_by_sitter', showArchived)
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
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">{showArchived ? 'Archived' : 'Bookings'}</h1>
        <Link
          href={
            showArchived ? '/dashboard/havener/bookings' : '/dashboard/havener/bookings?archived=1'
          }
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          {showArchived ? '← Back to bookings' : 'View archived'}
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          No requests yet — when an owner contacts you, their request shows up
          here for you to book or decline.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const status = bookingPhase(booking, 'sitter');
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
