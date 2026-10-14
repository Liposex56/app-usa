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
  // Timed services start and finish by themselves; make sure the list is current.
  await supabase.rpc('advance_booking_statuses' as never);
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
        <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">{showArchived ? 'Archived' : 'Bookings'}</h1>
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
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
          No requests yet — when an owner contacts you, their request shows up
          here for you to book or decline.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const status = bookingPhase(booking, 'sitter');
            const owner = ownerById.get(booking.id);
            const name = owner?.display_name ?? 'Pet owner';
            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="group flex items-center gap-4 rounded-3xl border border-espresso-700/8 bg-hv-paper p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-hv-ink/30 sm:p-5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-espresso-600">
                  {name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl font-bold text-espresso-700">{name}</p>
                  <p className="text-[17px] text-espresso-500">
                    {serviceName(booking.service_type)} · {formatDate(booking.start_date)}
                    {booking.end_date && booking.end_date !== booking.start_date
                      ? ` – ${formatDate(booking.end_date)}`
                      : ''}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xl font-bold text-espresso-700">
                    {formatCents(booking.sitter_payout_cents)}
                  </p>
                  <p className="text-sm text-espresso-500">you earn</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[15px] font-semibold ${status.tone}`}
                >
                  {status.label}
                </span>
                <span
                  aria-hidden
                  className="text-xl text-espresso-500 transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
