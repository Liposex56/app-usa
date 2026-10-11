'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { text } from '@/lib/utils';

export type DecisionState = { error: string | null };

/**
 * Staff decision on a Havener's background check — for results that need a
 * human ("consider"), and for recording a check run by hand while no
 * screening provider is connected. Writing the row is enough: a database
 * trigger keeps sitter_profiles.background_check_status (the public badge)
 * in step. A rejection needs a reason, which the Havener sees.
 */
export async function decideBackgroundCheckAction(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  const { profile } = await requireStaff();

  const sitterId = text(formData, 'sitterId');
  const decision = text(formData, 'decision');
  const note = text(formData, 'note');

  if (!sitterId || (decision !== 'clear' && decision !== 'rejected' && decision !== 'reset')) {
    return { error: 'Invalid request.' };
  }
  if (decision === 'rejected' && !note) {
    return { error: 'Give a reason — the Havener will see it.' };
  }

  const supabase = await createClient();
  const status = decision === 'reset' ? 'not_started' : decision;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('background_checks') as any).upsert(
    {
      sitter_id: sitterId,
      status,
      note: decision === 'rejected' ? note : null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      ...(decision === 'reset'
        ? {
            provider_candidate_id: null,
            provider_invitation_id: null,
            provider_report_id: null,
            invitation_url: null,
            completed_at: null,
          }
        : {}),
    },
    { onConflict: 'sitter_id' }
  );
  if (error) return { error: error.message };

  revalidatePath('/dashboard/admin/background-checks');
  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/havener/verification');
  revalidatePath('/search');
  return { error: null };
}
