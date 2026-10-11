import type { Metadata } from 'next';
import Link from 'next/link';

import type { BookingRow, PublicSitterRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { bookingPhase } from '@/lib/booking-phase';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'My bookings' };

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const profile = await requireProfile();
  const showArchived = (await searchParams).archived === '1';
  const supabase = await createClient();

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('owner_id', profile.id)
    .eq('archived_by_owner', showArchived)
    .order('created_at', { ascending: false });

  const bookings = (data ?? []) as BookingRow[];
  const sitterIds = [...new Set(bookings.map((b) => b.sitter_id))];
  const { data: sitters } = sitterIds.length
    ? await supabase.from('public_sitters').select('id, display_name').in('id', sitterIds)
    : { data: [] as Pick<PublicSitterRow, 'id' | 'display_name'>[] };
  const sitterName = new Map(
    (sitters ?? []).map((s) => [s.id, s.display_name ?? 'Havener'])
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">{showArchived ? 'Archived bookings' : 'My bookings'}</h1>
        <Link
          href={showArchived ? '/dashboard/bookings' : '/dashboard/bookings?archived=1'}
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          {showArchived ? '← Back to bookings' : 'View archived'}
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
          {showArchived ? (
            'Nothing archived.'
          ) : (
            <>
              You haven&rsquo;t requested a booking yet.{' '}
              <Link href="/search" className="font-medium text-gold-600">
                Find a Havener →
              </Link>
            </>
          )}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const status = bookingPhase(booking, 'owner');
            const name = sitterName.get(booking.sitter_id) ?? 'Havener';
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
                    {formatCents(booking.total_cents)}
                  </p>
                  <p className="text-sm text-espresso-500">total</p>
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
