'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type ReviewState = { error: string | null };

/**
 * Staff approve or reject a Havener's listing. Approving flips
 * `sitter_profiles.status`, which is exactly what the public search and
 * profile pages key off — RLS (`sitters: staff update`) is the real guard,
 * the staff check here just gives a clean error first.
 */
export async function reviewHavenerProfileAction(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  await requireStaff();

  const sitterId = text(formData, 'sitterId');
  const decision = text(formData, 'decision');
  if (!sitterId || (decision !== 'approved' && decision !== 'rejected')) {
    return { error: 'Solicitud inválida.' };
  }

  const reason = text(formData, 'reason');
  if (decision === 'rejected' && !reason) {
    return { error: 'Indica el motivo para que el Havener sepa qué corregir.' };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('sitter_profiles') as any)
    .update(
      decision === 'approved'
        ? { status: 'approved', approved_at: new Date().toISOString(), rejection_reason: null }
        : { status: 'rejected', rejection_reason: reason }
    )
    .eq('id', sitterId);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/havener-profiles');
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard');
  revalidatePath('/search');
  return { error: null };
}
