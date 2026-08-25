import { redirect } from 'next/navigation';

import type { ProfileRow, StaffRole } from '@/lib/database.types';
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

/**
 * Returns the signed-in user's profile plus their staff role, or redirects
 * to /dashboard if they aren't staff. RLS on `staff_members` only lets a
 * staff member read that table at all, so a non-staff user simply gets no
 * row back here — there's no separate "is this person staff" check to keep
 * in sync with the database.
 */
export async function requireStaff(): Promise<{
  profile: ProfileRow;
  role: StaffRole;
}> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: staffRow } = await supabase
    .from('staff_members')
    .select('role')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!staffRow) redirect('/dashboard');

  return { profile, role: staffRow.role };
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
