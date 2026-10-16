import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BookingsInbox } from '@/components/bookings-inbox';
import type { BookingCounterparty, BookingRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { parseInboxFilter } from '@/lib/inbox';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Bookings' };

export default async function HavenerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; archived?: string }>;
}) {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');
  const filter = parseInboxFilter(await searchParams);

  const supabase = await createClient();
  // Timed services start and finish by themselves; make sure the list is current.
  await supabase.rpc('advance_booking_statuses' as never);
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
      const name = (counterparty as BookingCounterparty[] | null)?.[0]?.display_name;
      return [booking.id, name ?? 'Pet owner'] as const;
    })
  );

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to dashboard
      </Link>
      <h1 className="mb-6 mt-6 text-[clamp(34px,3.4vw,46px)] leading-none">Bookings</h1>

      <BookingsInbox
        viewer="sitter"
        bookings={bookings}
        names={new Map(owners)}
        basePath="/dashboard/havener/bookings"
        filter={filter}
        emptyAll="No requests yet — when an owner contacts you, their request shows up here for you to book or decline."
      />
    </div>
  );
}
