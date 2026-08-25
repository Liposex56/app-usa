import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-bone">
      <header className="border-b border-espresso-700/8 bg-bone/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <LogoLink width={118} />

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-espresso-700"
            >
              Dashboard
            </Link>
            {profile.is_owner && (
              <Link
                href="/dashboard/pets"
                className="text-sm text-espresso-500 hover:text-espresso-700"
              >
                My pets
              </Link>
            )}
            {profile.is_havener && (
              <Link
                href="/dashboard/havener"
                className="text-sm text-espresso-500 hover:text-espresso-700"
              >
                Havener profile
              </Link>
            )}
            {isStaff && (
              <Link
                href="/dashboard/admin"
                className="text-sm text-espresso-500 hover:text-espresso-700"
              >
                Panel administrativo
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-espresso-500 sm:inline">
              {profile.display_name ?? profile.first_name ?? 'Your account'}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-espresso-700/15 px-4 py-1.5 text-sm text-espresso-600 transition-colors hover:border-espresso-700/30 hover:text-espresso-700"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-page py-10 sm:py-14">{children}</main>
    </div>
  );
}
