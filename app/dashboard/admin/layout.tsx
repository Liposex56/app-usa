import Link from 'next/link';

import { requireStaff } from '@/lib/auth';

const LINKS = [
  { href: '/dashboard/admin', label: 'Overview' },
  { href: '/dashboard/admin/havener-profiles', label: 'Profiles' },
  { href: '/dashboard/admin/background-checks', label: 'Background checks' },
  { href: '/dashboard/admin/insurance', label: 'Insurance' },
  { href: '/dashboard/admin/bookings', label: 'Bookings' },
  { href: '/dashboard/admin/cancellations', label: 'Cancellations' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Commission' },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStaff();

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Admin panel</p>
        <nav className="mt-3 flex flex-wrap items-center gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full bg-hv-paper px-4 py-1.5 text-[17px] font-semibold text-espresso-700 transition-colors hover:bg-hv-sky"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
