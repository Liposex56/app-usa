import { PayoutsBanner } from '@/components/payouts-banner';
import { SignedInHeader } from '@/components/signed-in-header';
import { buildNavLinks } from '@/lib/nav';
import { requireProfile } from '@/lib/auth';
import { loadUnreadCount } from '@/lib/notifications';
import { getStripe } from '@/lib/stripe';
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

  // A Havener who hasn't connected their payout account is reminded on every
  // page (only once payments are switched on).
  let needsPayouts = false;
  if (profile.is_havener && getStripe()) {
    const { data: sitter } = await supabase
      .from('sitter_profiles')
      .select('stripe_charges_enabled')
      .eq('id', profile.id)
      .maybeSingle();
    needsPayouts = Boolean(sitter && !sitter.stripe_charges_enabled);
  }

  return (
    <div className="min-h-screen bg-bone">
      <SignedInHeader
        links={links}
        name={profile.display_name ?? profile.first_name ?? 'Your account'}
        unread={await loadUnreadCount(supabase, profile.id)}
      />
      {needsPayouts && <PayoutsBanner />}

      <main className="container-page py-10 sm:py-14">{children}</main>
    </div>
  );
}
