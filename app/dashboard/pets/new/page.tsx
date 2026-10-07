import type { Metadata } from 'next';
import Link from 'next/link';

import { PetForm } from '@/app/onboarding/pet/pet-form';
import { requireProfile } from '@/lib/auth';

export const metadata: Metadata = { title: 'Add a pet' };

export default async function NewPetPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const profile = await requireProfile();
  const { returnTo } = await searchParams;

  // Only ever bounce back to a page on this site.
  const safeReturnTo =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={safeReturnTo ?? '/dashboard'}
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        {safeReturnTo ? '← Back' : '← Back to dashboard'}
      </Link>
      <div className="mt-6">
        <PetForm isHavener={profile.is_havener} hideSteps returnTo={safeReturnTo} />
      </div>
    </div>
  );
}
