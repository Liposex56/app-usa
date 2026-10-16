import Link from 'next/link';

import type { Viewer } from '@/lib/booking-phase';
import { bookingPhase } from '@/lib/booking-phase';
import type { BookingRow } from '@/lib/database.types';
import {
  INBOX_TABS,
  inboxTabOf,
  wasCarriedOut,
  type InboxFilter,
  type InboxTab,
} from '@/lib/inbox';
import { serviceName } from '@/lib/services';
import { cn, formatCents, formatDate } from '@/lib/utils';

import { ButtonLink } from '@/components/ui/button';

/** Bookings, split into tabs with counts. Used by owners and by Haveners. */
export function BookingsInbox({
  viewer,
  bookings,
  names,
  basePath,
  filter,
  emptyAll,
}: {
  viewer: Viewer;
  bookings: BookingRow[];
  /** The other party's name, by booking id. */
  names: Map<string, string>;
  basePath: string;
  filter: InboxFilter;
  emptyAll: React.ReactNode;
}) {
  const tabOf = new Map(bookings.map((booking) => [booking.id, inboxTabOf(booking, viewer)]));

  const counts: Record<InboxFilter, number> = {
    all: 0,
    requests: 0,
    upcoming: 0,
    current: 0,
    past: 0,
    archived: 0,
  };
  for (const tab of tabOf.values()) {
    counts[tab] += 1;
    if (tab !== 'archived') counts.all += 1;
  }

  const visible = bookings
    .filter((booking) => {
      const tab = tabOf.get(booking.id) as InboxTab;
      return filter === 'all' ? tab !== 'archived' : tab === filter;
    })
    // What is about to happen goes first; history goes newest first.
    .sort((a, b) =>
      filter === 'upcoming' || filter === 'current'
        ? a.start_date.localeCompare(b.start_date)
        : b.created_at.localeCompare(a.created_at)
    );

  const empty = INBOX_TABS.find((tab) => tab.id === filter)?.empty ?? '';

  return (
    <div>
      <nav aria-label="Bookings" className="flex flex-wrap items-center gap-2">
        {INBOX_TABS.map((tab) => {
          const active = tab.id === filter;
          return (
            <Link
              key={tab.id}
              href={tab.id === 'all' ? basePath : `${basePath}?tab=${tab.id}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[17px] font-semibold transition-colors',
                active
                  ? 'bg-hv-ink text-hv-cream'
                  : 'bg-hv-paper text-espresso-700 hover:bg-hv-sky'
              )}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span
                  className={cn(
                    'rounded-full px-2 text-[14px] leading-6',
                    active ? 'bg-hv-cream/20' : 'bg-espresso-700/8'
                  )}
                >
                  {counts[tab.id]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-espresso-700/15 bg-hv-paper p-10 text-center text-sm text-espresso-500">
          {filter === 'all' ? emptyAll : empty}
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {visible.map((booking) => {
            const status = bookingPhase(booking, viewer);
            const name = names.get(booking.id) ?? (viewer === 'owner' ? 'Havener' : 'Pet owner');
            const amount =
              viewer === 'owner' ? booking.total_cents : booking.sitter_payout_cents;
            const bookAgain = viewer === 'owner' && wasCarriedOut(booking.status);

            return (
              <div
                key={booking.id}
                className="flex items-center gap-3 rounded-3xl border border-espresso-700/8 bg-hv-paper p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-hv-ink/30 sm:p-5"
              >
                <Link
                  href={`/dashboard/bookings/${booking.id}`}
                  className="group flex min-w-0 flex-1 items-center gap-4"
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
                    {status.hint && (
                      <p className="mt-0.5 text-[15px] text-olive-600">{status.hint}</p>
                    )}
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xl font-bold text-espresso-700">{formatCents(amount)}</p>
                    <p className="text-sm text-espresso-500">
                      {viewer === 'owner' ? 'total' : 'you earn'}
                    </p>
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

                {bookAgain && (
                  <ButtonLink
                    href={`/sitters/${booking.sitter_id}/contact?rebook=1&service=${booking.service_type}`}
                    size="sm"
                    variant="secondary"
                    className="hidden shrink-0 sm:inline-flex"
                  >
                    Book again
                  </ButtonLink>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
