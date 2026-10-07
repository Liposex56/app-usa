'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/** A pet owner decides to start offering care too. */
export async function becomeHavenerAction(): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({ is_havener: true })
    .eq('id', profile.id);

  revalidatePath('/dashboard');
  redirect('/dashboard/havener/edit');
}

/** A Havener who also needs care for their own pet. */
export async function addPetProfileAction(): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('profiles') as any)
    .update({ is_owner: true })
    .eq('id', profile.id);

  revalidatePath('/dashboard');
  redirect('/dashboard/pets/new');
}

/**
 * The daily "I'm still available" tap. It stamps `calendar_updated_at`,
 * which search reads to show how fresh a Havener's availability is and to
 * rank the ones who keep it current at the top.
 */
export async function confirmAvailabilityAction(): Promise<void> {
  const profile = await requireProfile();
  if (!profile.is_havener) return;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('sitter_profiles') as any)
    .update({ calendar_updated_at: new Date().toISOString() })
    .eq('id', profile.id);

  revalidatePath('/dashboard');
}
