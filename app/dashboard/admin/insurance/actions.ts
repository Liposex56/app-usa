'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type ReviewState = { error: string | null };

/**
 * Approve or reject a Havener's insurance submission. Two writes:
 * `sitter_insurance` (the private submission, staff-only) and
 * `sitter_profiles.insurance_status` (the column that drives the public
 * "Insured" badge and the certified-Havener check). Both are staff-gated by
 * RLS independently of the check here — this is defense in depth, not the
 * only guard.
 */
export async function reviewInsuranceAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const { profile } = await requireStaff();

  const sitterId = text(formData, 'sitterId');
  if (!sitterId) return { error: 'Solicitud inválida.' };

  const rawDecision = text(formData, 'decision');
  if (rawDecision !== 'approved' && rawDecision !== 'rejected') {
    return { error: 'Solicitud inválida.' };
  }
  const decision: 'approved' | 'rejected' = rawDecision;

  const supabase = await createClient();

  const { error: insuranceError } = await supabase
    .from('sitter_insurance')
    .update({
      status: decision,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('sitter_id', sitterId);

  if (insuranceError) return { error: insuranceError.message };

  const { error: profileError } = await supabase
    .from('sitter_profiles')
    .update({ insurance_status: decision })
    .eq('id', sitterId);

  if (profileError) return { error: profileError.message };

  revalidatePath('/dashboard/admin/insurance');
  revalidatePath('/dashboard/admin');
  return { error: null };
}
