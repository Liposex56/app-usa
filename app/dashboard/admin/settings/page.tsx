import type { Metadata } from 'next';

import { requireStaff } from '@/lib/auth';
import { todayInAppZone } from '@/lib/dates';
import { commissionPercentFromSettings } from '@/lib/payments';
import { createClient } from '@/lib/supabase/server';

import { AutoRatesForm } from './auto-rates-form';
import { CommissionForm } from './commission-form';
import { HolidaysPanel, type HolidayPeriod } from './holidays-panel';

export const metadata: Metadata = { title: 'Rates — Admin panel' };

export default async function AdminSettingsPage() {
  const { role } = await requireStaff();
  const supabase = await createClient();

  const [{ data: settings }, { data: periods }] = await Promise.all([
    supabase
      .from('platform_settings')
      .select(
        'company_commission_percent, auto_stay_holiday_percent, auto_stay_extended_percent, auto_stay_extended_min_units, auto_stay_puppy_percent, auto_stay_additional_less_cents, auto_visit_sixty_percent, auto_visit_additional_less_percent, auto_visit_puppy_percent, auto_house_additional_less_percent, auto_visit_holiday_percent, auto_visit_cat_less_percent'
      )
      .eq('id', 1)
      .maybeSingle(),
    supabase
      .from('holiday_periods')
      .select('id, name, year, starts_at, ends_at, active')
      .gte('ends_at', todayInAppZone())
      .order('starts_at')
      .limit(60),
  ]);

  const canEdit = role === 'admin';

  return (
    <div className="space-y-6">
      <CommissionForm initialPercent={commissionPercentFromSettings(settings)} canEdit={canEdit} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AutoRatesForm
          canEdit={canEdit}
          defaults={{
            stayHoliday: settings?.auto_stay_holiday_percent ?? null,
            stayExtended: settings?.auto_stay_extended_percent ?? null,
            stayExtendedMinUnits: settings?.auto_stay_extended_min_units ?? null,
            stayPuppy: settings?.auto_stay_puppy_percent ?? null,
            stayAdditionalLess:
              settings?.auto_stay_additional_less_cents != null
                ? settings.auto_stay_additional_less_cents / 100
                : null,
            visitSixty: settings?.auto_visit_sixty_percent ?? null,
            visitAdditionalLess: settings?.auto_visit_additional_less_percent ?? null,
            visitPuppy: settings?.auto_visit_puppy_percent ?? null,
            houseAdditionalLess: settings?.auto_house_additional_less_percent ?? null,
            visitHoliday: settings?.auto_visit_holiday_percent ?? null,
            visitCatLess: settings?.auto_visit_cat_less_percent ?? null,
          }}
        />
        <HolidaysPanel periods={(periods ?? []) as HolidayPeriod[]} />
      </div>
    </div>
  );
}
