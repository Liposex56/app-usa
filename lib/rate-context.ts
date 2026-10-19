import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { todayInAppZone } from '@/lib/dates';
import { DEFAULT_COMMISSION_PERCENT } from '@/lib/payments';
import type { AutoRatePercents } from '@/lib/pricing';

/**
 * What a price depends on besides the Havener's own rates: Havenr's
 * percentages for automatic rates and the upcoming holidays.
 */
export async function loadRateContext(supabase: SupabaseClient<Database>): Promise<{
  percents: AutoRatePercents;
  holidayDays: string[];
}> {
  const [{ data: percentRows }, { data: holidayRows }] = await Promise.all([
    supabase.rpc('auto_rate_percents'),
    supabase.from('holidays').select('day').gte('day', todayInAppZone()).order('day'),
  ]);

  const row = (percentRows ?? [])[0];
  return {
    percents: {
      holiday: row?.holiday ?? null,
      additionalPet: row?.additional_pet ?? null,
      extendedStay: row?.extended_stay ?? null,
    },
    holidayDays: (holidayRows ?? []).map((holiday) => holiday.day as string),
  };
}

/**
 * Havenr's commission, read through a function because the settings table
 * itself is staff-only. Falls back to the default if it can't be read.
 */
export async function loadCommissionPercent(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { data } = await supabase.rpc('current_commission_percent');
  return typeof data === 'number' ? data : DEFAULT_COMMISSION_PERCENT;
}

/** True once Havenr has set all three automatic-rate percentages. */
export function autoRatesAvailable(percents: AutoRatePercents): boolean {
  return (
    percents.holiday != null && percents.additionalPet != null && percents.extendedStay != null
  );
}
