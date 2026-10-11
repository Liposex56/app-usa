import { Nanum_Pen_Script } from 'next/font/google';
import Link from 'next/link';

import { SiteHeader } from '@/components/site-header';
import { createClient } from '@/lib/supabase/server';

/** The hand-written notes of the hero and the closing illustration. */
const hand = Nanum_Pen_Script({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
  variable: '--font-hand',
});

const LEGAL = [
  { href: '/legal/terms', label: 'Terms of service' },
  { href: '/legal/privacy', label: 'Privacy policy' },
  { href: '/legal/cookies', label: 'Cookie preferences' },
];

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div
      className={`${hand.variable} hv-home flex min-h-screen flex-col bg-hv-cream font-display text-hv-ink antialiased`}
    >
      <SiteHeader isSignedIn={Boolean(user)} />
      <main className="flex-1 overflow-x-clip">{children}</main>

      {/* Slim legal strip — the landing design ends with the sand banner. */}
      <footer className="bg-hv-ink text-hv-cream/70">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-4 text-[14px] sm:flex-row sm:items-center sm:justify-between lg:px-[clamp(20px,4.6vw,66px)]">
          <p>© {new Date().getFullYear()} Havenr. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-1">
            {LEGAL.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-hv-cream">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
