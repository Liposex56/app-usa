import Image from 'next/image';
import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-6 text-center">
      <Image
        src="/brand/mark-dog.png"
        alt=""
        width={783}
        height={384}
        className="h-auto w-56 opacity-60"
      />
      <h1 className="mt-8 text-3xl">This page ran off</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-espresso-500">
        We couldn’t find what you were looking for. It may have moved, or the
        link might be out of date.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <ButtonLink href="/services" variant="secondary">
          Browse services
        </ButtonLink>
      </div>
      <Link
        href="/dashboard"
        className="mt-6 text-sm text-espresso-500 underline underline-offset-4 hover:text-espresso-700"
      >
        Go to my dashboard
      </Link>
    </div>
  );
}
