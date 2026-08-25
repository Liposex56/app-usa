import type { Metadata } from 'next';

import { requireProfile } from '@/lib/auth';

import { UpdatePasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Set a new password' };

export default async function UpdatePasswordPage() {
  await requireProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bone px-5 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-3xl">Set a new password</h1>
        <p className="mt-2 text-[15px] text-espresso-500">
          Choose something you haven’t used anywhere else.
        </p>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
