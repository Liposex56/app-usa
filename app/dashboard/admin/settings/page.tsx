import type { Metadata } from 'next';

import { requireStaff } from '@/lib/auth';
import { todayInAppZone } from '@/lib/dates';
import { commissionPercentFromSettings } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';

import { AutoRatesForm } from './auto-rates-form';
import { CommissionForm } from './commission-form';
import { HolidaysPanel } from './holidays-panel';

export const metadata: Metadata = { title: 'Rates — Admin panel' };

export default async function AdminSettingsPage() {
  const { role } = await requireStaff();
  const supabase = await createClient();

  const [{ data: settings }, { data: holidays }] = await Promise.all([
    supabase
      .from('platform_settings')
      .select(
        'company_commission_percent, auto_holiday_percent, auto_additional_pet_percent, auto_extended_stay_percent'
      )
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('holidays')
      .select('day, name')
      .gte('day', todayInAppZone())
      .order('day')
      .limit(40),
  ]);

  const canEdit = role === 'admin';

  return (
    <div className="space-y-6">
      <CommissionForm initialPercent={commissionPercentFromSettings(settings)} canEdit={canEdit} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AutoRatesForm
          canEdit={canEdit}
          defaults={{
            holiday: settings?.auto_holiday_percent ?? null,
            additionalPet: settings?.auto_additional_pet_percent ?? null,
            extendedStay: settings?.auto_extended_stay_percent ?? null,
          }}
        />
        <HolidaysPanel holidays={(holidays ?? []) as Array<{ day: string; name: string }>} />
      </div>
    </div>
  );
}
