'use server';

import { revalidatePath } from 'next/cache';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type ActionState = { error: string | null };

/** Every date from start to end (inclusive), as 'YYYY-MM-DD' strings. */
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

export async function blockDatesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  if (!profile.is_havener) return { error: 'Not a Havener account.' };

  const startDate = text(formData, 'startDate');
  const endDate = text(formData, 'endDate') || startDate;
  const note = text(formData, 'note');

  if (!startDate) return { error: 'Elige al menos una fecha.' };
  if (endDate! < startDate) {
    return { error: 'La fecha final no puede ser antes de la inicial.' };
  }

  const dates = dateRange(startDate, endDate!);
  if (dates.length > 366) {
    return { error: 'Ese rango es demasiado grande — inténtalo por partes.' };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('sitter_availability') as any).upsert(
    dates.map((date) => ({
      sitter_id: profile.id,
      date,
      is_available: false,
      note: note || null,
    })),
    { onConflict: 'sitter_id,date' }
  );

  if (error) return { error: error.message };

  revalidatePath('/dashboard/havener/availability');
  return { error: null };
}

export async function unblockDatesAction(
  startDate: string,
  endDate: string
): Promise<ActionState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from('sitter_availability')
    .delete()
    .eq('sitter_id', profile.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/havener/availability');
  return { error: null };
}
