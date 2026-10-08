import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, ServiceType } from '@/lib/database.types';

/**
 * Sitter ids that are unavailable for [startDate, endDate], for either of
 * two reasons:
 *  1. A confirmed/in-progress booking overlaps it. A booking with a null
 *     end_date is a single day (its own start_date). Only `confirmed` and
 *     `in_progress` block — a still-open `requested` inquiry doesn't (an
 *     owner may have contacted several Haveners at once, and the first to
 *     accept wins), and a declined or cancelled row never blocks anything.
 *  2. The Havener explicitly blocked a day in that range themselves
 *     (`sitter_availability`, managed at /dashboard/havener/availability —
 *     "absent row = available", so only rows with is_available = false
 *     count here).
 */
export async function sitterIdsWithConflict(
  supabase: SupabaseClient<Database>,
  startDate: string,
  endDate: string,
  sitterIds?: string[],
  /**
   * When the service is known, availability is judged per service by spaces:
   * a Havener is free as long as the pets already booked (plus these) stay
   * within the number of spaces they set for that service on every day.
   */
  options?: { service: ServiceType; pets?: number }
): Promise<Set<string>> {
  if (sitterIds && sitterIds.length > 0 && options?.service) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('sitters_unavailable', {
      p_sitter_ids: sitterIds,
      p_service: options.service,
      p_start: startDate,
      p_end: endDate,
      p_pets: Math.max(1, options.pets ?? 1),
    });
    if (!error) {
      return new Set(((data ?? []) as Array<{ sitter_id: string }>).map((row) => row.sitter_id));
    }
    // If the capacity function isn't there yet, fall back to the older rule below.
  }

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
