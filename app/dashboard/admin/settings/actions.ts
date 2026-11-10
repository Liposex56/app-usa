'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type SettingsState = { error: string | null; saved?: boolean };

export async function updateCommissionAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { profile, role } = await requireStaff();
  if (role !== 'admin') {
    return { error: 'Only an administrator can change the commission.' };
  }

  const raw = formData.get('commissionPercent');
  const percent = typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: 'Enter a percentage between 0 and 100.' };
  }

  const supabase = await createClient();
  // `as any`: see the comment in dashboard/admin/insurance/actions.ts —
  // supabase-js's generated Update overload collapses to `never` here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('platform_settings') as any)
    .update({
      company_commission_percent: percent,
      updated_by: profile.id,
    })
    .eq('id', 1);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  revalidatePath('/dashboard/admin');
  return { error: null, saved: true };
}

function numberField(
  formData: FormData,
  name: string,
  min: number,
  max: number
): number | null | 'invalid' {
  const raw = formData.get(name);
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < min || value > max) return 'invalid';
  return value;
}

/**
 * The rules behind "automatic rates", for stays and for visits. Leaving one
 * empty keeps that switch unavailable to Haveners until Havenr sets it.
 */
export async function updateAutoRatesAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { profile, role } = await requireStaff();
  if (role !== 'admin') {
    return { error: 'Only an administrator can change the automatic rates.' };
  }

  const fields = {
    auto_stay_holiday_percent: numberField(formData, 'stayHolidayPercent', 0, 500),
    auto_stay_extended_percent: numberField(formData, 'stayExtendedPercent', -90, 200),
    auto_stay_extended_min_units: numberField(formData, 'stayExtendedMinUnits', 2, 60),
    auto_stay_puppy_percent: numberField(formData, 'stayPuppyPercent', 0, 200),
    auto_stay_additional_less_cents: numberField(formData, 'stayAdditionalLess', 0, 1000),
    auto_visit_sixty_percent: numberField(formData, 'visitSixtyPercent', 0, 500),
    auto_visit_additional_less_percent: numberField(formData, 'visitAdditionalLessPercent', 0, 100),
    auto_visit_puppy_percent: numberField(formData, 'visitPuppyPercent', 0, 200),
    auto_house_additional_less_percent: numberField(formData, 'houseAdditionalLessPercent', 0, 100),
    auto_visit_holiday_percent: numberField(formData, 'visitHolidayPercent', 0, 500),
    auto_visit_cat_less_percent: numberField(formData, 'visitCatLessPercent', 0, 100),
  };
  const invalid = Object.entries(fields).find(([, value]) => value === 'invalid');
  if (invalid) return { error: 'One of the values is out of range — check the hints under each field.' };

  const minUnits = fields.auto_stay_extended_min_units;
  const lessDollars = fields.auto_stay_additional_less_cents;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('platform_settings') as any)
    .update({
      ...fields,
      // Whole numbers only: nights as a count, dollars stored as cents.
      auto_stay_extended_min_units: typeof minUnits === 'number' ? Math.round(minUnits) : null,
      auto_stay_additional_less_cents:
        typeof lessDollars === 'number' ? Math.round(lessDollars) * 100 : null,
      updated_by: profile.id,
    })
    .eq('id', 1);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  return { error: null, saved: true };
}

// ---------------------------------------------------------------------------
// Holiday periods
// ---------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function periodFromForm(
  formData: FormData
):
  | { error: string }
  | { name: string; year: number; starts_at: string; ends_at: string; active: boolean } {
  const name = formData.get('name');
  const startDate = formData.get('startDate');
  const endDate = formData.get('endDate');
  const startTime = formData.get('startTime');
  const endTime = formData.get('endTime');

  if (typeof name !== 'string' || !name.trim()) return { error: 'Give the holiday a name.' };
  if (typeof startDate !== 'string' || !DATE.test(startDate)) {
    return { error: 'Choose the start date.' };
  }
  if (typeof endDate !== 'string' || !DATE.test(endDate)) return { error: 'Choose the end date.' };

  const from = typeof startTime === 'string' && TIME.test(startTime) ? startTime : '00:00';
  const to = typeof endTime === 'string' && TIME.test(endTime) ? endTime : '23:59';
  const starts_at = `${startDate} ${from}`;
  const ends_at = `${endDate} ${to}`;
  if (ends_at < starts_at) return { error: 'The end can’t be before the start.' };

  return {
    name: name.trim().slice(0, 80),
    year: Number(startDate.slice(0, 4)),
    starts_at,
    ends_at,
    active: formData.get('active') === 'on',
  };
}

export async function addHolidayPeriodAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireStaff();
  const period = periodFromForm(formData);
  if ('error' in period) return period;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('holiday_periods') as any).upsert(period, {
    onConflict: 'name,year',
  });
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  return { error: null, saved: true };
}

export async function updateHolidayPeriodAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireStaff();
  const id = formData.get('id');
  if (typeof id !== 'string') return { error: 'Missing holiday.' };
  const period = periodFromForm(formData);
  if ('error' in period) return period;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('holiday_periods') as any).update(period).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  return { error: null, saved: true };
}

export async function removeHolidayPeriodAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const supabase = await createClient();
  await supabase.from('holiday_periods').delete().eq('id', id);
  revalidatePath('/dashboard/admin/settings');
}
