'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IconClose, IconMenu } from '@/components/icons';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/trust-and-safety', label: 'Trust & Safety' },
  { href: '/become-a-havener', label: 'Become A Havener' },
];

export function SiteHeader({ isSignedIn }: { isSignedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="container-page">
        <div className="flex h-16 items-center justify-between gap-6 rounded-full border border-espresso-700/8 bg-bone/90 px-5 shadow-card backdrop-blur sm:px-7">
          <Link href="/" aria-label="Havenr — home" className="inline-flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/homepage/header-dog-icon.svg"
              alt=""
              aria-hidden
              width={91}
              height={43}
              className="h-6 w-auto"
            />
            <Logo width={100} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    active
                      ? 'text-espresso-700'
                      : 'text-espresso-700/80 hover:text-espresso-700'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center justify-center rounded-full bg-sky-200 px-5 text-sm font-bold text-espresso-700 transition-colors hover:bg-sky-300"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-sky-200 px-5 text-sm font-bold text-espresso-700 transition-colors hover:bg-sky-300"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-espresso-700 transition-colors hover:text-gold-600"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-espresso-700 transition-colors hover:bg-espresso-700/5 lg:hidden"
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        {open && (
          <div className="mt-2 rounded-3xl border border-espresso-700/8 bg-bone shadow-card lg:hidden">
            <div className="flex flex-col gap-1 p-4">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-espresso-700 hover:bg-espresso-700/5"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-espresso-700/8 pt-4">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-sky-200 text-sm font-bold text-espresso-700"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-sky-200 text-sm font-bold text-espresso-700"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="inline-flex h-10 items-center justify-center text-sm font-bold text-espresso-700"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
