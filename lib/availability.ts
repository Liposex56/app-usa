import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/**
 * Sitter ids that have a confirmed/in-progress booking overlapping
 * [startDate, endDate]. A booking with a null end_date is a single day
 * (its own start_date). Bookings are auto-confirmed the moment they're
 * created (see requestBookingAction), so `confirmed`/`in_progress` is the
 * complete set of "this Havener is unavailable" statuses — a declined or
 * cancelled row never blocks anything.
 */
export async function sitterIdsWithConflict(
  supabase: SupabaseClient<Database>,
  startDate: string,
  endDate: string,
  sitterIds?: string[]
): Promise<Set<string>> {
  let query = supabase
    .from('bookings')
    .select('sitter_id')
    .in('status', ['confirmed', 'in_progress'])
    .lte('start_date', endDate)
    .or(`end_date.gte.${startDate},and(end_date.is.null,start_date.gte.${startDate})`);

  if (sitterIds) {
    if (sitterIds.length === 0) return new Set();
    query = query.in('sitter_id', sitterIds);
  }

  const { data } = await query;
  return new Set((data ?? []).map((row) => row.sitter_id as string));
}
