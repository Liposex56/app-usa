import type { Metadata } from 'next';
import Link from 'next/link';

import { requireProfile } from '@/lib/auth';

import { AccountForm } from './account-form';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← Back to dashboard
      </Link>
      <h1 className="mb-2 mt-6 text-[clamp(34px,3.4vw,46px)] leading-none">Account</h1>
      <p className="mb-8 text-[17px] text-espresso-500">
        Your contact details and how we reach you.
      </p>

      <AccountForm
        profile={{
          email: profile.email,
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
          marketing_opt_in: profile.marketing_opt_in,
        }}
      />
    </div>
  );
}
