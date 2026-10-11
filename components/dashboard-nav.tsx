'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { NavLink } from '@/lib/nav';
import { cn } from '@/lib/utils';

/**
 * Top navigation of the signed-in area. Same espresso bar as the public site;
 * the current section is underlined and, on small screens, the links live in a
 * menu (they used to disappear).
 */
export function DashboardNav({
  links,
  name,
}: {
  links: NavLink[];
  name: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // The most specific link that prefixes the current path is the active one.
  const matches = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  const active = links
    .filter((l) => [l.href, ...(l.also ?? [])].some(matches))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const signOut = (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="rounded-full bg-hv-sky px-6 py-1 text-[17px] font-semibold text-hv-ink transition-colors hover:bg-white"
      >
        Log out
      </button>
    </form>
  );

  return (
    <>
      <nav className="ml-6 hidden items-center gap-[clamp(0.9rem,1.7vw,2rem)] text-[clamp(15px,1.15vw,18px)] font-semibold whitespace-nowrap xl:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'border-b-2 py-1 transition-opacity',
              link.href === active
                ? 'border-hv-sky'
                : 'border-transparent hover:opacity-70'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto hidden items-center gap-5 xl:flex">
        <span className="max-w-[16ch] truncate text-[17px] font-medium text-hv-cream/70">
          {name}
        </span>
        {signOut}
      </div>

      <button
        type="button"
        className="ml-auto flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`h-0.5 w-6 bg-hv-cream transition-transform ${open ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`h-0.5 w-6 bg-hv-cream transition-opacity ${open ? 'opacity-0' : ''}`} />
        <span className={`h-0.5 w-6 bg-hv-cream transition-transform ${open ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-14 flex flex-col gap-4 border-t border-hv-cream/15 bg-hv-ink px-5 py-6 text-xl font-semibold xl:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.href === active ? 'text-hv-sky' : ''}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-hv-cream/15 pt-5">
            <span className="truncate text-[17px] font-medium text-hv-cream/70">{name}</span>
            {signOut}
          </div>
        </nav>
      )}
    </>
  );
}
