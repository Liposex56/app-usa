'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { NavLink } from '@/lib/nav';
import { cn } from '@/lib/utils';

const ACCOUNT_HREF = '/dashboard/settings';
const NOTIFICATIONS_HREF = '/dashboard/notifications';

/** The bell: opens the notifications page; a badge counts the ones not opened yet. */
function NotificationsLink({ unread, active }: { unread: number; active: boolean }) {
  return (
    <Link
      href={NOTIFICATIONS_HREF}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-hv-cream/10',
        active && 'bg-hv-cream/10'
      )}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-hv-sky px-1 text-[12px] font-bold leading-none text-hv-ink">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

/** The person's name in the bar; opens account details and log out. */
function AccountMenu({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-hv-cream/10"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-hv-sky text-[17px] font-bold text-hv-ink">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[14ch] truncate text-[17px] font-medium text-hv-cream/80">
          {name}
        </span>
        <span aria-hidden className="text-[11px] text-hv-cream/60">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-hv-cream/15 bg-hv-ink py-2 shadow-card"
        >
          <Link
            role="menuitem"
            href={ACCOUNT_HREF}
            className="block px-5 py-2.5 text-[17px] font-semibold transition-colors hover:bg-hv-cream/10"
          >
            Account
          </Link>
          <form action="/auth/signout" method="post">
            <button
              role="menuitem"
              type="submit"
              className="block w-full px-5 py-2.5 text-left text-[17px] font-semibold transition-colors hover:bg-hv-cream/10"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * Top navigation of the signed-in area. Same espresso bar as the public site;
 * the current section is underlined and, on small screens, the links live in a
 * menu (they used to disappear).
 */
export function DashboardNav({
  links,
  name,
  unread = 0,
}: {
  links: NavLink[];
  name: string;
  unread?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  // The most specific link that prefixes the current path is the active one.
  // The dashboard home only lights up on itself, so Account and the like don't.
  const matches = (prefix: string) =>
    pathname === prefix || (prefix !== '/dashboard' && pathname.startsWith(`${prefix}/`));
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

      <div className="ml-auto hidden items-center gap-1 xl:flex">
        <NotificationsLink unread={unread} active={pathname === NOTIFICATIONS_HREF} />
        <AccountMenu name={name} />
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
          <Link
            href={NOTIFICATIONS_HREF}
            className={pathname === NOTIFICATIONS_HREF ? 'text-hv-sky' : ''}
          >
            Notifications{unread > 0 ? ` (${unread})` : ''}
          </Link>
          <Link
            href={ACCOUNT_HREF}
            className={pathname === ACCOUNT_HREF ? 'text-hv-sky' : ''}
          >
            Account
          </Link>
          <div className="mt-2 flex items-center justify-between gap-4 border-t border-hv-cream/15 pt-5">
            <span className="truncate text-[17px] font-medium text-hv-cream/70">{name}</span>
            {signOut}
          </div>
        </nav>
      )}
    </>
  );
}
