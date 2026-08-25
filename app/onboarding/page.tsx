import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { onboardingPath, requireProfile } from '@/lib/auth';

import { RoleForm } from './role-form';

export const metadata: Metadata = { title: 'Get started' };

export default async function OnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarding_step !== 'role') {
    redirect(onboardingPath(profile));
  }

  return <RoleForm firstName={profile.first_name} />;
}
