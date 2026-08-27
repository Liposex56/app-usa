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
      <div className="mt-6 flex flex-wrap justify-end gap-x-5 gap-y-1">
        <Link
          href={`/sitters/${profile.id}`}
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          View my public profile →
        </Link>
        <Link
          href="/dashboard/havener/services"
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          Manage your services →
        </Link>
        <Link
          href="/dashboard/havener/insurance"
          className="text-sm font-medium text-gold-600 hover:text-gold-700"
        >
          Gestionar mi seguro →
        </Link>
      </div>
      <div className="mt-4">
        <HavenerForm isOwner={profile.is_owner} hideSteps />
      </div>
    </div>
  );
}
