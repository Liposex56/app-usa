import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';
import { todayInAppZone } from '@/lib/dates';
import { DEFAULT_COMMISSION_PERCENT } from '@/lib/payments';
import type { AutoRatePercents, HolidayPeriod } from '@/lib/pricing';

/**
 * What a price depends on besides the Havener's own rates: Havenr's rules for
 * automatic rates and the upcoming holiday periods.
 */
export async function loadRateContext(supabase: SupabaseClient<Database>): Promise<{
  percents: AutoRatePercents;
  holidayPeriods: HolidayPeriod[];
}> {
  const [{ data: percentRows }, { data: periodRows }] = await Promise.all([
    supabase.rpc('auto_rate_percents'),
    supabase
      .from('holiday_periods')
      .select('starts_at, ends_at')
      .eq('active', true)
      .gte('ends_at', todayInAppZone())
      .order('starts_at'),
  ]);

  const row = (percentRows ?? [])[0];
  return {
    percents: {
      stayHoliday: row?.stay_holiday ?? null,
      stayExtended: row?.stay_extended ?? null,
      stayExtendedMinUnits: row?.stay_extended_min_units ?? null,
      stayPuppy: row?.stay_puppy ?? null,
      stayAdditionalLessCents: row?.stay_additional_less_cents ?? null,
      houseAdditionalLess: row?.house_additional_less ?? null,
      visitSixty: row?.visit_sixty ?? null,
      visitAdditionalLess: row?.visit_additional_less ?? null,
      visitPuppy: row?.visit_puppy ?? null,
      visitHoliday: row?.visit_holiday ?? null,
      visitCatLess: row?.visit_cat_less ?? null,
    },
    holidayPeriods: (periodRows ?? []).map((period) => ({
      start: (period.starts_at as string).slice(0, 10),
      end: (period.ends_at as string).slice(0, 10),
    })),
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

/** True once Havenr has set every automatic-rate value. */
export function autoRatesAvailable(percents: AutoRatePercents): boolean {
  return Object.values(percents).every((value) => value != null);
}
