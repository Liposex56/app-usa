'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { ServiceType } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { SERVICES } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

const MAX_SPACES = 50;

function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function spacesFrom(formData: FormData, service: ServiceType): number | null {
  const raw = formData.get(`spaces_${service}`);
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const value = Math.floor(Number(raw));
  if (!Number.isFinite(value) || value < 0 || value > MAX_SPACES) return null;
  return value;
}

/**
 * "Manage availability" for a day or a range: set how many pets to accept per
 * service, mark everything unavailable, or reset the range back to defaults.
 */
export async function saveCapacityAction(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard/calendar');

  const startDate = text(formData, 'startDate');
  const endDate = text(formData, 'endDate') ?? startDate;
  const month = text(formData, 'month') ?? '';
  const intent = text(formData, 'intent') ?? 'save';
  const back = `/dashboard/calendar?view=havener${month ? `&month=${month}` : ''}`;

  if (!startDate || !endDate || endDate < startDate) redirect(back);
  const dates = dateRange(startDate, endDate);
  if (dates.length > 366) redirect(back);

  const supabase = await createClient();
  const { data: offered } = await supabase
    .from('sitter_services')
    .select('service_type')
    .eq('sitter_id', profile.id)
    .eq('is_active', true);
  const services = (offered ?? []).map((row) => row.service_type as ServiceType);

  if (intent === 'reset') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sitter_capacity_overrides') as any)
      .delete()
      .eq('sitter_id', profile.id)
      .gte('date', startDate)
      .lte('date', endDate);
  } else {
    const rows = dates.flatMap((date) =>
      services.flatMap((service) => {
        const spaces = intent === 'unavailable' ? 0 : spacesFrom(formData, service);
        return spaces === null
          ? []
          : [{ sitter_id: profile.id, date, service_type: service, spaces }];
      })
    );
    if (rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('sitter_capacity_overrides') as any).upsert(rows, {
        onConflict: 'sitter_id,date,service_type',
      });
    }
  }

  // Updating the calendar counts as refreshing availability.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('sitter_profiles') as any)
    .update({ calendar_updated_at: new Date().toISOString() })
    .eq('id', profile.id);

  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard');
  redirect(back);
}

/** The number of spaces used on every day that has no override of its own. */
export async function saveDefaultCapacityAction(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard/calendar');
  const month = text(formData, 'month') ?? '';

  const supabase = await createClient();
  const rows = SERVICES.flatMap((service) => {
    const spaces = spacesFrom(formData, service.type);
    return spaces === null
      ? []
      : [{ sitter_id: profile.id, service_type: service.type, spaces }];
  });

  if (rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('sitter_service_capacity') as any).upsert(rows, {
      onConflict: 'sitter_id,service_type',
    });
  }

  revalidatePath('/dashboard/calendar');
  redirect(`/dashboard/calendar?view=havener${month ? `&month=${month}` : ''}`);
}
