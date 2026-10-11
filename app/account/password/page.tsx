import type { Metadata } from 'next';

import { AppHeader } from '@/components/app-header';
import { requireProfile } from '@/lib/auth';

import { UpdatePasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Set a new password' };

export default async function UpdatePasswordPage() {
  await requireProfile();

  return (
    <div className="min-h-screen bg-bone">
      <AppHeader />
      <div className="mx-auto w-full max-w-md px-5 py-16">
        <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">Set a new password</h1>
        <p className="mt-2 text-[17px] text-espresso-500">
          Choose something you haven’t used anywhere else.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
