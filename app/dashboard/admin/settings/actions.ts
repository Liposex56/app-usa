'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type SettingsState = { error: string | null };

export async function updateCommissionAction(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { profile, role } = await requireStaff();
  if (role !== 'admin') {
    return { error: 'Sólo un administrador puede cambiar la comisión.' };
  }

  const raw = formData.get('commissionPercent');
  const percent = typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { error: 'Ingresa un porcentaje entre 0 y 100.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('platform_settings')
    .update({
      company_commission_percent: percent,
      updated_by: profile.id,
    })
    .eq('id', 1);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/settings');
  revalidatePath('/dashboard/admin');
  return { error: null };
}
