import { DashboardNav } from '@/components/dashboard-nav';
import { LogoLink } from '@/components/logo';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { data: staffRow } = await supabase
    .from('staff_members')
    .select('role')
    .eq('user_id', profile.id)
    .maybeSingle();
  const isStaff = Boolean(staffRow);

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(profile.is_owner
      ? [
          { href: '/dashboard/pets', label: 'My pets' },
          { href: '/dashboard/bookings', label: 'My bookings' },
        ]
      : []),
    ...(profile.is_havener
      ? [
          { href: '/dashboard/havener', label: 'Havener profile' },
          { href: '/dashboard/havener/bookings', label: 'Booking requests' },
        ]
      : []),
    { href: '/dashboard/calendar', label: 'Calendar' },
    ...(isStaff ? [{ href: '/dashboard/admin', label: 'Admin panel' }] : []),
  ];

  return (
    <div className="min-h-screen bg-bone">
      <header className="sticky top-0 z-40 bg-hv-ink text-hv-cream">
        <div className="relative mx-auto flex h-14 max-w-[1440px] items-center px-5 lg:px-[clamp(20px,4.6vw,66px)]">
          <LogoLink tone="cream" width={156} />
          <DashboardNav
            links={links}
            name={profile.display_name ?? profile.first_name ?? 'Your account'}
          />
        </div>
      </header>

      <main className="container-page py-10 sm:py-14">{children}</main>
    </div>
  );
}
