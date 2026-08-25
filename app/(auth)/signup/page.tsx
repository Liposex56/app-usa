import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { SignUpForm } from './signup-form';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-3xl">Create your account</h1>
      <p className="mt-2 text-[15px] text-espresso-500">
        Free to join. You only pay when you confirm a booking.
      </p>

      <Suspense fallback={<div className="mt-8 h-96" />}>
        <SignUpForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-espresso-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
