import Link from 'next/link';

import { Logo } from '@/components/logo';
import { SERVICES } from '@/lib/services';

const COLUMNS = [
  {
    title: 'Services',
    links: SERVICES.map((s) => ({ href: `/services/${s.slug}`, label: s.name })),
  },
  {
    title: 'Company',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/trust-and-safety', label: 'Trust & safety' },
      { href: '/become-a-havener', label: 'Become a Havener' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/terms', label: 'Terms of service' },
      { href: '/legal/privacy', label: 'Privacy policy' },
      { href: '/legal/cookies', label: 'Cookie preferences' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-espresso-700 text-cream/80">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo tone="cream" variant="full" width={150} />
          <p className="mt-5 text-sm leading-relaxed text-cream/60">
            Trusted pet care, booked in minutes. Every Havener is background
            checked, interviewed, home verified and insured before they can
            take a booking.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream/45">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/75 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Havenr. All rights reserved.</p>
          <p>
            Havenr does not sell or share your address, location, bookings or
            conversations with advertising platforms.
          </p>
        </div>
      </div>
    </footer>
  );
}
