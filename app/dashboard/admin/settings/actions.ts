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

function percentField(
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
 * The percentages behind "automatic rates". Leaving one empty keeps that
 * switch unavailable to Haveners until Havenr sets it.
 */
export async function updateAutoRatesAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { profile, role } = await requireStaff();
  if (role !== 'admin') {
    return { error: 'Only an administrator can change the automatic rates.' };
  }

  const holiday = percentField(formData, 'holidayPercent', 0, 500);
  const additional = percentField(formData, 'additionalPetPercent', 0, 200);
  const extended = percentField(formData, 'extendedStayPercent', -90, 200);
  if (holiday === 'invalid') return { error: 'Holiday: enter a percentage from 0 to 500.' };
  if (additional === 'invalid') {
    return { error: 'Additional pet: enter a percentage from 0 to 200.' };
  }
  if (extended === 'invalid') {
    return { error: 'Extended stay: enter a percentage from -90 to 200.' };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('platform_settings') as any)
    .update({
      auto_holiday_percent: holiday,
      auto_additional_pet_percent: additional,
      auto_extended_stay_percent: extended,
      updated_by: profile.id,
    })
    .eq('id', 1);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  return { error: null, saved: true };
}

export async function addHolidayAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  await requireStaff();
  const day = formData.get('day');
  const name = formData.get('name');
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return { error: 'Choose the date.' };
  }
  if (typeof name !== 'string' || !name.trim()) return { error: 'Give the holiday a name.' };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('holidays') as any).upsert(
    { day, name: name.trim().slice(0, 60) },
    { onConflict: 'day' }
  );
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  return { error: null, saved: true };
}

export async function removeHolidayAction(formData: FormData): Promise<void> {
  await requireStaff();
  const day = formData.get('day');
  if (typeof day !== 'string') return;

  const supabase = await createClient();
  await supabase.from('holidays').delete().eq('day', day);
  revalidatePath('/dashboard/admin/settings');
}
