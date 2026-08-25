import Image from 'next/image';
import Link from 'next/link';

import { IconCheck } from '@/components/icons';
import { LogoLink } from '@/components/logo';

const POINTS = [
  'Every Havener is background checked, interviewed, home verified and insured',
  'Your address stays private until you confirm a booking',
  'Photos, GPS routes and reports on every service',
  'One clear total before you pay — no charges added quietly',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between bg-espresso-700 p-12 lg:flex">
        <LogoLink tone="cream" width={132} />

        <div>
          <h2 className="max-w-sm text-3xl font-light leading-tight text-cream">
            Pet care you can actually trust.
          </h2>
          <ul className="mt-9 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <IconCheck
                  width={19}
                  height={19}
                  className="mt-0.5 shrink-0 text-gold-400"
                />
                <span className="text-sm leading-relaxed text-cream/70">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Image
          src="/brand/mark-dog.png"
          alt=""
          width={783}
          height={384}
          className="h-auto w-52 opacity-90"
        />
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col bg-bone">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <LogoLink width={110} />
          <Link
            href="/"
            className="text-sm text-espresso-500 hover:text-espresso-700"
          >
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-4 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
