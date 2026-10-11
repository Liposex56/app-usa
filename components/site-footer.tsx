import Link from 'next/link';

import { HavenrLogo } from '@/components/home/logo';
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
    <footer className="bg-hv-ink text-hv-cream">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-[clamp(20px,4.6vw,66px)]">
        <div className="max-w-xs">
          <HavenrLogo className="text-[40px] text-hv-cream" />
          <p className="mt-5 text-[17px] font-medium leading-snug text-hv-cream/70">
            Trusted pet care, booked in minutes. Every Havener is background
            checked, interviewed, home verified and insured before they can
            take a booking.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-[15px] font-bold uppercase tracking-[0.14em] text-hv-sky">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[18px] font-medium text-hv-cream/85 transition-colors hover:text-hv-sky"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-hv-cream/15">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-5 py-5 text-[15px] font-medium text-hv-cream/55 sm:flex-row sm:items-center sm:justify-between lg:px-[clamp(20px,4.6vw,66px)]">
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
