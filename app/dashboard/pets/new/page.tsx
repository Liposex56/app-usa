import type { Metadata } from 'next';
import Link from 'next/link';

import { PetForm } from '@/app/onboarding/pet/pet-form';
import { requireProfile } from '@/lib/auth';

export const metadata: Metadata = { title: 'Add a pet' };

export default async function NewPetPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-6">
        <PetForm isHavener={profile.is_havener} hideSteps />
      </div>
    </div>
  );
}
