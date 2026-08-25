import type { Metadata } from 'next';

import { requireStaff } from '@/lib/auth';
import { commissionPercentFromSettings } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';

import { CommissionForm } from './commission-form';

export const metadata: Metadata = { title: 'Comisión — Panel administrativo' };

export default async function AdminSettingsPage() {
  const { role } = await requireStaff();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('company_commission_percent')
    .eq('id', 1)
    .maybeSingle();

  return (
    <CommissionForm
      initialPercent={commissionPercentFromSettings(settings)}
      canEdit={role === 'admin'}
    />
  );
}
