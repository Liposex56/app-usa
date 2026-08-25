import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCheck } from '@/components/icons';

export const metadata: Metadata = { title: 'Check your email' };

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-500 text-white">
        <IconCheck width={26} height={26} />
      </span>

      <h1 className="mt-6 text-3xl">Check your email</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-espresso-500">
        We sent a confirmation link
        {email ? (
          <>
            {' '}
            to <strong className="font-medium text-espresso-700">{email}</strong>
          </>
        ) : null}
        . Click it and we’ll pick up right where you left off.
      </p>

      <div className="mt-8 rounded-2xl border border-espresso-700/8 bg-white p-6 text-left">
        <h2 className="text-sm font-medium text-espresso-700">
          Didn’t get it?
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-espresso-500">
          <li>· Check your spam or promotions folder.</li>
          <li>· The link expires after a while — request a new one by logging in.</li>
          <li>· Make sure the address you typed is right.</li>
        </ul>
      </div>

      <Link
        href="/login"
        className="mt-8 inline-block text-sm font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
      >
        Back to log in
      </Link>
    </div>
  );
}
