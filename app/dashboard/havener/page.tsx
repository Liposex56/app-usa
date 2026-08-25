import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { HavenerForm } from '@/app/onboarding/havener/havener-form';
import { requireProfile } from '@/lib/auth';

export const metadata: Metadata = { title: 'Havener profile' };

export default async function HavenerSettingsPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>
      <div className="mt-6">
        <HavenerForm isOwner={profile.is_owner} hideSteps />
      </div>
    </div>
  );
}
