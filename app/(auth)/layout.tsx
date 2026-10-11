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
        <LogoLink tone="cream" width={156} />

        <div>
          <h2 className="max-w-md text-[clamp(38px,3.6vw,56px)] leading-[0.95] text-hv-cream">
            Pet care you can actually <span className="text-hv-sky">trust.</span>
          </h2>
          <ul className="mt-9 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <IconCheck
                  width={20}
                  height={20}
                  className="mt-1 shrink-0 text-hv-sky"
                />
                <span className="text-[19px] font-medium leading-snug text-cream/80">
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
        <div className="flex h-14 items-center justify-between bg-hv-ink px-5 lg:hidden">
          <LogoLink tone="cream" width={140} />
          <Link
            href="/"
            className="text-[17px] font-semibold text-hv-cream hover:opacity-70"
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
