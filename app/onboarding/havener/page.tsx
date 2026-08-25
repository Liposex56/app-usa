import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';

import { HavenerForm } from './havener-form';

export const metadata: Metadata = { title: 'Your Havener profile' };

export default async function HavenerOnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarding_step === 'role') redirect('/onboarding');
  if (!profile.is_havener) redirect('/dashboard');

  return <HavenerForm isOwner={profile.is_owner} />;
}
