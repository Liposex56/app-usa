import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type {
  BookingOwnerFeedbackRow,
  BookingOwnerProfile,
  BookingRow,
  PetRow,
} from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { OwnerProfileTabs } from './owner-profile-tabs';

export const metadata: Metadata = { title: 'Pet owner' };

export default async function BookingOwnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!bookingRow) notFound();
  const booking = bookingRow as BookingRow;

  // This screen is the Havener's view of who they're caring for — an owner
  // looking at their own profile would just see their own dashboard.
  if (booking.sitter_id !== profile.id) redirect(`/dashboard/bookings/${id}`);

  const [{ data: ownerRows }, { data: feedbackRows }, { data: petRows }] =
    await Promise.all([
      supabase.rpc('booking_owner_profile', { p_booking_id: id }),
      supabase.rpc('booking_owner_feedback', { p_booking_id: id }),
      supabase.rpc('booking_owner_pets', { p_booking_id: id }),
    ]);

  const owner = (ownerRows as BookingOwnerProfile[] | null)?.[0] ?? null;
  if (!owner) notFound();
  const feedback = (feedbackRows ?? []) as BookingOwnerFeedbackRow[];
  const pets = (petRows ?? []) as PetRow[];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/bookings/${id}`}
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to booking
      </Link>

      <OwnerProfileTabs owner={owner} feedback={feedback} pets={pets} />
    </div>
  );
}
