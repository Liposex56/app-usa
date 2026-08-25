import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-3xl">Welcome back</h1>
      <p className="mt-2 text-[15px] text-espresso-500">
        Log in to manage your bookings, pets and messages.
      </p>

      <Suspense fallback={<div className="mt-8 h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-espresso-500">
        New to Havenr?{' '}
        <Link
          href="/signup"
          className="font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
