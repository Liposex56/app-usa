'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/** Marks one notification read and goes to what it is about. */
export async function openNotificationAction(formData: FormData): Promise<void> {
  const id = formData.get('id');
  const href = formData.get('href');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (typeof id === 'string') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('notifications') as any)
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('read_at', null);
  }

  revalidatePath('/dashboard', 'layout');
  // Only ever go to a page of this app.
  redirect(typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') ? href : '/dashboard/notifications');
}

export async function markAllReadAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('notifications') as any)
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  revalidatePath('/dashboard', 'layout');
}
