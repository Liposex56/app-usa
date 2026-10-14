import type { Metadata } from 'next';
import Link from 'next/link';

import type { BookingRow, ProfileRow } from '@/lib/database.types';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents, formatDate } from '@/lib/utils';

import { CancellationDecisionButtons } from './decision-buttons';

export const metadata: Metadata = { title: 'Cancellations — Admin panel' };

export default async function AdminCancellationsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .not('cancellation_requested_at', 'is', null)
    .order('cancellation_requested_at', { ascending: true });
  const bookings = (data ?? []) as BookingRow[];

  const ids = [...new Set(bookings.flatMap((b) => [b.owner_id, b.sitter_id]))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
    for (const p of (profiles ?? []) as ProfileRow[]) {
      names.set(p.id, p.display_name || p.email || p.id);
    }
  }

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-hv-sky/30 p-4 text-[17px] text-espresso-700">
        Cancellations are requested inside the Havener’s cancellation window and need
        Havenr’s confirmation. Refunds or fees follow the cancellation policy the
        Havener chose for that service.
      </p>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-[17px] text-espresso-500">
          No cancellation requests waiting.
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const asker =
              booking.cancellation_requested_by === booking.sitter_id ? 'Havener' : 'Owner';
            return (
              <div
                key={booking.id}
                className="flex flex-col gap-4 rounded-2xl border border-espresso-700/10 bg-hv-paper p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1.5">
                  <p className="text-[18px] font-semibold text-espresso-700">
                    {serviceName(booking.service_type)} · {formatDate(booking.start_date)}
                    {booking.end_date && booking.end_date !== booking.start_date
                      ? ` – ${formatDate(booking.end_date)}`
                      : ''}{' '}
                    · {formatCents(booking.total_cents)}
                  </p>
                  <p className="text-[16px] text-espresso-500">
                    {names.get(booking.owner_id) ?? 'Owner'} →{' '}
                    {names.get(booking.sitter_id) ?? 'Havener'}
                  </p>
                  <p className="text-[16px] text-espresso-600">
                    Asked by the {asker} on{' '}
                    {formatDate((booking.cancellation_requested_at ?? '').slice(0, 10))}:{' '}
                    “{booking.cancellation_request_reason}”
                  </p>
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="inline-block text-[16px] font-semibold text-gold-700 hover:underline"
                  >
                    Open the booking and its chat →
                  </Link>
                </div>
                <CancellationDecisionButtons bookingId={booking.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
