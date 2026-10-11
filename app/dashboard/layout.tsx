import { SignedInHeader } from '@/components/signed-in-header';
import { buildNavLinks } from '@/lib/nav';
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

  const links = buildNavLinks(profile, isStaff);

  return (
    <div className="min-h-screen bg-bone">
      <SignedInHeader
        links={links}
        name={profile.display_name ?? profile.first_name ?? 'Your account'}
      />

      <main className="container-page py-10 sm:py-14">{children}</main>
    </div>
  );
}
