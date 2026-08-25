import type { Metadata } from 'next';
import Link from 'next/link';

import { ForgotPasswordForm } from './forgot-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mt-2 text-[15px] text-espresso-500">
        Enter your email and we’ll send you a link to set a new one.
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 text-center text-sm text-espresso-500">
        Remembered it?{' '}
        <Link
          href="/login"
          className="font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
        >
          Back to log in
        </Link>
      </p>
    </div>
  );
}
