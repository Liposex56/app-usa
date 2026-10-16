import type { BookingRow } from '@/lib/database.types';
import type { Viewer } from '@/lib/booking-phase';

/**
 * The tabs of the bookings list, for owners and Haveners alike. One place says
 * which tab a booking belongs to, so the counts and the list never disagree.
 */
export type InboxTab = 'requests' | 'upcoming' | 'current' | 'past' | 'archived';
export type InboxFilter = 'all' | InboxTab;

export const INBOX_TABS: Array<{ id: InboxFilter; label: string; empty: string }> = [
  { id: 'all', label: 'All', empty: '' },
  { id: 'requests', label: 'Requests', empty: 'No open requests right now.' },
  { id: 'upcoming', label: 'Upcoming', empty: 'Nothing coming up.' },
  { id: 'current', label: 'In progress', empty: 'Nothing in progress right now.' },
  { id: 'past', label: 'Past', empty: 'No past bookings yet.' },
  { id: 'archived', label: 'Archived', empty: 'Nothing archived.' },
];

/** Accepts `?tab=` and the older `?archived=1` link. */
export function parseInboxFilter(params: { tab?: string; archived?: string }): InboxFilter {
  if (params.archived === '1') return 'archived';
  const match = INBOX_TABS.find((tab) => tab.id === params.tab);
  return match ? match.id : 'all';
}

type Classifiable = Pick<BookingRow, 'status' | 'archived_by_owner' | 'archived_by_sitter'>;

export function inboxTabOf(booking: Classifiable, viewer: Viewer): InboxTab {
  const archived = viewer === 'owner' ? booking.archived_by_owner : booking.archived_by_sitter;
  if (archived) return 'archived';
  switch (booking.status) {
    case 'requested':
      return 'requests';
    case 'confirmed':
      return 'upcoming';
    case 'in_progress':
      return 'current';
    default:
      return 'past';
  }
}

/** Statuses of a service that was actually carried out (worth booking again). */
const CARRIED_OUT = new Set<BookingRow['status']>(['completed', 'pending_payout', 'paid_out']);

export function wasCarriedOut(status: BookingRow['status']): boolean {
  return CARRIED_OUT.has(status);
}
