import type { BookingRow, BookingStatus } from '@/lib/database.types';

export type Viewer = 'owner' | 'sitter';

export type BookingPhase = { label: string; tone: string; hint: string | null };

const BASE: Record<BookingStatus, { label: string; tone: string }> = {
  requested: { label: 'Request', tone: 'bg-cream text-olive-600' },
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

/**
 * What to call a booking right now. A service is only "confirmed" when both
 * sides have clicked Book; while just one has, it's "pending" — even if the
 * owner has already paid.
 */
export function bookingPhase(
  booking: Pick<BookingRow, 'status' | 'owner_booked_at' | 'sitter_booked_at'>,
  viewer: Viewer
): BookingPhase {
  if (booking.status !== 'requested') {
    return { ...BASE[booking.status], hint: null };
  }

  const ownerBooked = Boolean(booking.owner_booked_at);
  const sitterBooked = Boolean(booking.sitter_booked_at);

  if (ownerBooked && sitterBooked) {
    return { ...BASE.confirmed, hint: null };
  }
  if (ownerBooked || sitterBooked) {
    const mine = viewer === 'owner' ? ownerBooked : sitterBooked;
    return {
      label: 'Pending',
      tone: 'bg-gold-500/15 text-gold-700',
      hint: mine
        ? `Waiting for the ${viewer === 'owner' ? 'Havener' : 'owner'} to click Book.`
        : `The ${viewer === 'owner' ? 'Havener' : 'owner'} has booked — it’s your turn.`,
    };
  }
  return viewer === 'owner'
    ? { label: 'Waiting on Havener', tone: BASE.requested.tone, hint: null }
    : { label: 'New request', tone: BASE.requested.tone, hint: null };
}
