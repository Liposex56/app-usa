'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard/havener', label: 'Overview', exact: true },
  { href: '/dashboard/havener/edit', label: 'Edit profile' },
  { href: '/dashboard/havener/services', label: 'Services & rates' },
  { href: '/dashboard/havener/availability', label: 'Availability' },
  { href: '/dashboard/havener/home', label: 'Home photos & video' },
  { href: '/dashboard/havener/verification', label: 'Verification' },
  { href: '/dashboard/havener/insurance', label: 'Insurance' },
  { href: '/dashboard/havener/payments', label: 'Payments' },
  { href: '/dashboard/havener/bookings', label: 'Booking requests' },
];

/**
 * Section navigation for everything a Havener manages. A sticky column on
 * desktop; a row of pills that scrolls sideways on phones.
 */
export function HavenerNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Havener settings"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-10 sm:px-10 lg:sticky lg:top-20 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-espresso-700/8 lg:bg-hv-paper lg:p-3 lg:shadow-card"
    >
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[18px] font-semibold transition-colors lg:rounded-2xl',
              active
                ? 'bg-hv-ink text-hv-cream'
                : 'bg-hv-paper text-espresso-700 hover:bg-hv-sky lg:bg-transparent'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
