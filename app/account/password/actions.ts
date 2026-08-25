'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type PasswordState = { error: string | null };

export async function updatePasswordAction(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const password = formData.get('password');
  const confirm = formData.get('confirmPassword');

  if (typeof password !== 'string' || password.length < 8) {
    return { error: 'Your password needs at least 8 characters.' };
  }
  if (password !== confirm) {
    return { error: 'Those passwords don’t match.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect('/dashboard');
}
