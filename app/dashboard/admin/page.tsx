import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCard, IconShield } from '@/components/icons';
import { createClient } from '@/lib/supabase/server';
import { commissionPercentFromSettings } from '@/lib/payments';

export const metadata: Metadata = { title: 'Panel administrativo' };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: pendingInsurance }, { data: settings }] = await Promise.all([
    supabase
      .from('sitter_insurance')
      .select('sitter_id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('platform_settings')
      .select('company_commission_percent')
      .eq('id', 1)
      .maybeSingle(),
  ]);

  const commissionPercent = commissionPercentFromSettings(settings);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Link
        href="/dashboard/admin/insurance"
        className="rounded-2xl border border-espresso-700/10 bg-white p-6 shadow-card transition-colors hover:border-gold-500/50"
      >
        <IconShield className="h-6 w-6 text-gold-600" />
        <p className="mt-4 text-2xl font-semibold text-espresso-700">
          {pendingInsurance ?? 0}
        </p>
        <p className="text-sm text-espresso-500">
          Seguro{pendingInsurance === 1 ? '' : 's'} pendiente
          {pendingInsurance === 1 ? '' : 's'} de revisión
        </p>
      </Link>

      <Link
        href="/dashboard/admin/settings"
        className="rounded-2xl border border-espresso-700/10 bg-white p-6 shadow-card transition-colors hover:border-gold-500/50"
      >
        <IconCard className="h-6 w-6 text-gold-600" />
        <p className="mt-4 text-2xl font-semibold text-espresso-700">
          {commissionPercent}% / {(100 - commissionPercent).toFixed(2).replace(/\.?0+$/, '')}%
        </p>
        <p className="text-sm text-espresso-500">
          Comisión empresa / pago al Havener
        </p>
      </Link>
    </div>
  );
}
