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
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl">{showArchived ? 'Archived bookings' : 'My bookings'}</h1>
        <Link
          href={showArchived ? '/dashboard/bookings' : '/dashboard/bookings?archived=1'}
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          {showArchived ? '← Back to bookings' : 'View archived'}
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
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
            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-espresso-700/8 bg-white p-5 shadow-card transition-colors hover:border-gold-500/40"
              >
                <div>
                  <p className="font-medium text-espresso-700">
                    {serviceName(booking.service_type)} with{' '}
                    {sitterName.get(booking.sitter_id) ?? 'Havener'}
                  </p>
                  <p className="mt-1 text-sm text-espresso-500">
                    {formatDate(booking.start_date)}
                    {booking.end_date ? ` – ${formatDate(booking.end_date)}` : ''}
                    {' · '}
                    {formatCents(booking.total_cents)}
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
