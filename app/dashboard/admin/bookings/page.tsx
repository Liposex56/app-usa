import type { Metadata } from 'next';
import Link from 'next/link';

import type { BookingRow, BookingStatus, ProfileRow } from '@/lib/database.types';
import { bookingPhase } from '@/lib/booking-phase';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Bookings — Admin panel' };

const LIMIT = 100;

const FILTERS: Array<{ value: string; label: string; statuses?: BookingStatus[] }> = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Requests', statuses: ['requested'] },
  { value: 'confirmed', label: 'Confirmed', statuses: ['confirmed'] },
  { value: 'in_progress', label: 'In progress', statuses: ['in_progress'] },
  {
    value: 'completed',
    label: 'Completed',
    statuses: ['completed', 'pending_payout', 'paid_out'],
  },
  {
    value: 'problem',
    label: 'Cancelled / disputed',
    statuses: ['cancelled', 'declined', 'disputed', 'refunded'],
  },
];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  const filter = FILTERS.find((f) => f.value === (status ?? '')) ?? FILTERS[0];

  let query = supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LIMIT);
  if (filter.statuses) query = query.in('status', filter.statuses);

  const { data } = await query;
  const bookings = (data ?? []) as BookingRow[];

  const peopleIds = [...new Set(bookings.flatMap((b) => [b.owner_id, b.sitter_id]))];
  const names = new Map<string, string>();
  if (peopleIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', peopleIds);
    for (const p of (profiles ?? []) as ProfileRow[]) {
      names.set(p.id, p.display_name || p.email || p.id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Link
            key={item.value || 'all'}
            href={item.value ? `/dashboard/admin/bookings?status=${item.value}` : '/dashboard/admin/bookings'}
            className={`rounded-full px-4 py-1.5 text-[16px] font-semibold transition-colors ${
              item.value === filter.value
                ? 'bg-hv-ink text-hv-cream'
                : 'bg-hv-paper text-espresso-700 hover:bg-hv-sky'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-[17px] text-espresso-500">
          No bookings here yet.
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const phase = bookingPhase(booking, 'owner');
            return (
              <Link
                key={booking.id}
                href={`/dashboard/bookings/${booking.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-espresso-700/10 bg-hv-paper p-4 transition-colors hover:border-hv-ink/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[18px] font-semibold text-espresso-700">
                    {serviceName(booking.service_type)} ·{' '}
                    {formatDate(booking.start_date)}
                    {booking.end_date ? ` – ${formatDate(booking.end_date)}` : ''}
                  </p>
                  <p className="truncate text-[16px] text-espresso-500">
                    {names.get(booking.owner_id) ?? 'Owner'} →{' '}
                    {names.get(booking.sitter_id) ?? 'Havener'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${phase.tone}`}>
                    {phase.label}
                  </span>
                  <span className="text-[16px] font-semibold text-espresso-700">
                    {formatCents(booking.total_cents)}
                  </span>
                  <span className="text-sm text-espresso-500">
                    {booking.payment_status === 'paid' ? 'Paid' : 'Not paid'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
