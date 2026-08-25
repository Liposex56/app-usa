import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';

import { OwnerProfileForm } from './owner-form';

export const metadata: Metadata = { title: 'Your details' };

export default async function OwnerOnboardingPage() {
  const profile = await requireProfile();

  if (profile.onboarding_step === 'role') redirect('/onboarding');

  return (
    <OwnerProfileForm
      profile={{
        first_name: profile.first_name,
        last_name: profile.last_name,
        display_name: profile.display_name,
        phone: profile.phone,
        address_line1: profile.address_line1,
        address_line2: profile.address_line2,
        city: profile.city,
        state: profile.state,
        postal_code: profile.postal_code,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
      }}
      isOwner={profile.is_owner}
    />
  );
}
