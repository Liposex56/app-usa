import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';

import { PetForm } from './pet-form';

export const metadata: Metadata = { title: 'Your pet' };

export default async function PetOnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarding_step === 'role') redirect('/onboarding');
  if (!profile.is_owner) redirect('/onboarding/havener');

  return <PetForm isHavener={profile.is_havener} />;
}
