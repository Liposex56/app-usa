import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/**
 * Sitter ids that are unavailable for [startDate, endDate], for either of
 * two reasons:
 *  1. A confirmed/in-progress booking overlaps it. A booking with a null
 *     end_date is a single day (its own start_date). Bookings are
 *     auto-confirmed the moment they're created (see requestBookingAction),
 *     so `confirmed`/`in_progress` is the complete set of "busy" statuses —
 *     a declined or cancelled row never blocks anything.
 *  2. The Havener explicitly blocked a day in that range themselves
 *     (`sitter_availability`, managed at /dashboard/havener/availability —
 *     "absent row = available", so only rows with is_available = false
 *     count here).
 */
export async function sitterIdsWithConflict(
  supabase: SupabaseClient<Database>,
  startDate: string,
  endDate: string,
  sitterIds?: string[]
): Promise<Set<string>> {
  let bookingsQuery = supabase
    .from('bookings')
    .select('sitter_id')
    .in('status', ['confirmed', 'in_progress'])
    .lte('start_date', endDate)
    .or(`end_date.gte.${startDate},and(end_date.is.null,start_date.gte.${startDate})`);

  let blockedQuery = supabase
    .from('sitter_availability')
    .select('sitter_id')
    .eq('is_available', false)
    .gte('date', startDate)
    .lte('date', endDate);

  if (sitterIds) {
    if (sitterIds.length === 0) return new Set();
    bookingsQuery = bookingsQuery.in('sitter_id', sitterIds);
    blockedQuery = blockedQuery.in('sitter_id', sitterIds);
  }

  const [{ data: booked }, { data: blocked }] = await Promise.all([
    bookingsQuery,
    blockedQuery,
  ]);

  const ids = new Set<string>();
  (booked ?? []).forEach((row) => ids.add(row.sitter_id as string));
  (blocked ?? []).forEach((row) => ids.add(row.sitter_id as string));
  return ids;
}
