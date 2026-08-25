import { redirect } from 'next/navigation';

import type { ProfileRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';

/**
 * Returns the signed-in user's profile, or redirects to /login.
 * The middleware already guards these routes; this is the second gate, so a
 * page can never render with a null user by accident.
 */
export async function requireProfile(): Promise<ProfileRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // The handle_new_user() trigger should have created this. If it didn't
    // (trigger not installed yet), create it now rather than dead-ending.
    const { data: created, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: user.email })
      .select('*')
      .single();

    if (error || !created) redirect('/login?error=profile_missing');
    return created as ProfileRow;
  }

  return profile as ProfileRow;
}

/** Where a partially onboarded user should be sent next. */
export function onboardingPath(profile: ProfileRow): string {
  switch (profile.onboarding_step) {
    case 'role':
      return '/onboarding';
    case 'owner_profile':
      return '/onboarding/owner';
    case 'pet':
      return '/onboarding/pet';
    case 'havener':
      return '/onboarding/havener';
    default:
      return '/dashboard';
  }
}
