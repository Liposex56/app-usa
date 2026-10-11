'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { links, nav } from '@/components/home/content';
import { HavenrLogo } from '@/components/home/logo';

const PILL =
  'rounded-full bg-hv-sky px-[clamp(1.5rem,2.8vw,2.5rem)] py-1 text-hv-ink transition-colors hover:bg-white';

/**
 * Site-wide top bar (the one of the final landing design): sticky espresso
 * bar, anchors that scroll the home page to each section, Log In / Get Started
 * or Dashboard when there is a session.
 */
export function SiteHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-hv-ink font-display text-hv-cream">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center whitespace-nowrap px-5 lg:px-[clamp(20px,4.6vw,66px)]">
        <Link href="/" aria-label="Havenr — home" className="shrink-0" onClick={() => setOpen(false)}>
          <HavenrLogo className="text-[32px] lg:text-[40px]" />
        </Link>

        <nav className="ml-[clamp(1.5rem,calc(29vw-225px),189px)] hidden items-center gap-[clamp(1.25rem,4vw,58px)] text-[clamp(17px,1.32vw,19px)] font-semibold lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-opacity hover:opacity-70">
              {item.label}
            </Link>
          ))}
          <Link href={links.becomeHavener} className="transition-opacity hover:opacity-70">
            Become A Havener
          </Link>
        </nav>

        <div className="ml-auto hidden items-center gap-[clamp(1.25rem,3.2vw,46px)] text-[clamp(17px,1.32vw,19px)] font-semibold lg:flex">
          {isSignedIn ? (
            <Link href="/dashboard" className={PILL}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href={links.login} className={PILL}>
                Log In
              </Link>
              <Link href={links.getStarted} className="transition-opacity hover:opacity-70">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="ml-auto flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-0.5 w-6 bg-hv-cream transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`h-0.5 w-6 bg-hv-cream transition-opacity ${open ? 'opacity-0' : ''}`} />
          <span className={`h-0.5 w-6 bg-hv-cream transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-hv-cream/15 px-5 py-6 text-xl font-semibold lg:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href={links.becomeHavener} onClick={() => setOpen(false)}>
            Become A Havener
          </Link>
          <div className="mt-2 flex items-center gap-6">
            {isSignedIn ? (
              <Link href="/dashboard" className="rounded-full bg-hv-sky px-8 py-1.5 text-hv-ink">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href={links.login} className="rounded-full bg-hv-sky px-8 py-1.5 text-hv-ink">
                  Log In
                </Link>
                <Link href={links.getStarted}>Get Started</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
