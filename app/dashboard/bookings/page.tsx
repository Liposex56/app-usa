import type { Metadata } from 'next';
import Link from 'next/link';

import { BookingsInbox } from '@/components/bookings-inbox';
import type { BookingRow, PublicSitterRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { parseInboxFilter } from '@/lib/inbox';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'My bookings' };

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; archived?: string }>;
}) {
  const profile = await requireProfile();
  const filter = parseInboxFilter(await searchParams);
  const supabase = await createClient();
  // Timed services start and finish by themselves; make sure the list is current.
  await supabase.rpc('advance_booking_statuses' as never);

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
  const sitterName = new Map((sitters ?? []).map((s) => [s.id, s.display_name ?? 'Havener']));
  const names = new Map(
    bookings.map((booking) => [booking.id, sitterName.get(booking.sitter_id) ?? 'Havener'])
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to dashboard
      </Link>
      <h1 className="mb-6 mt-6 text-[clamp(34px,3.4vw,46px)] leading-none">My bookings</h1>

      <BookingsInbox
        viewer="owner"
        bookings={bookings}
        names={names}
        basePath="/dashboard/bookings"
        filter={filter}
        emptyAll={
          <>
            You haven&rsquo;t requested a booking yet.{' '}
            <Link href="/search" className="font-medium text-gold-600">
              Find a Havener →
            </Link>
          </>
        }
      />
    </div>
  );
}
