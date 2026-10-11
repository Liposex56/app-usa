import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCard, IconShield } from '@/components/icons';
import { commissionPercentFromSettings } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Admin panel' };

function Card({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-espresso-700/10 bg-hv-paper p-6 shadow-card transition-colors hover:border-hv-ink/40"
    >
      {icon}
      <p className="mt-4 text-3xl font-bold text-espresso-700">{value}</p>
      <p className="text-[17px] text-espresso-500">{label}</p>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: pendingInsurance },
    { count: pendingProfiles },
    { count: reviewChecks },
    { count: users },
    { count: activeBookings },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('sitter_insurance')
      .select('sitter_id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('sitter_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('background_checks') as any)
      .select('sitter_id', { count: 'exact', head: true })
      .eq('status', 'consider'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['requested', 'confirmed', 'in_progress']),
    supabase
      .from('platform_settings')
      .select('company_commission_percent')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  const commissionPercent = commissionPercentFromSettings(settings);
  const icon = <IconShield className="h-6 w-6 text-gold-600" />;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        href="/dashboard/admin/havener-profiles"
        icon={icon}
        value={pendingProfiles ?? 0}
        label={`Havener profile${pendingProfiles === 1 ? '' : 's'} waiting for approval`}
      />
      <Card
        href="/dashboard/admin/background-checks"
        icon={icon}
        value={reviewChecks ?? 0}
        label={`Background check${reviewChecks === 1 ? '' : 's'} needing review`}
      />
      <Card
        href="/dashboard/admin/insurance"
        icon={icon}
        value={pendingInsurance ?? 0}
        label={`Insurance submission${pendingInsurance === 1 ? '' : 's'} waiting for review`}
      />
      <Card
        href="/dashboard/admin/bookings"
        icon={icon}
        value={activeBookings ?? 0}
        label={`Open booking${activeBookings === 1 ? '' : 's'} (requests, confirmed, in progress)`}
      />
      <Card
        href="/dashboard/admin/users"
        icon={icon}
        value={users ?? 0}
        label={`User${users === 1 ? '' : 's'}`}
      />
      <Card
        href="/dashboard/admin/settings"
        icon={<IconCard className="h-6 w-6 text-gold-600" />}
        value={`${commissionPercent}% / ${(100 - commissionPercent).toFixed(2).replace(/\.?0+$/, '')}%`}
        label="Company commission / Havener payout"
      />
    </div>
  );
}
