import type { Metadata } from 'next';
import Link from 'next/link';

import type { BookingRow, BookingStatus, PublicSitterRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'My bookings' };

const STATUS_LABEL: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: 'Waiting on Havener', tone: 'bg-cream text-olive-600' },
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

export default async function OwnerBookingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('owner_id', profile.id)
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
      <h1 className="mt-6 text-3xl">My bookings</h1>

      {bookings.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center text-sm text-espresso-500">
          You haven&rsquo;t requested a booking yet.{' '}
          <Link href="/search" className="font-medium text-gold-600">
            Find a Havener →
          </Link>
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_LABEL[booking.status];
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
