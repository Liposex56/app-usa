import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconArrowRight } from '@/components/icons';
import type { SitterServiceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { SERVICES } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils';

export const metadata: Metadata = { title: 'Your services · Havenr' };

export default async function HavenerServicesPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_services')
    .select('*')
    .eq('sitter_id', profile.id);

  const rows = (data ?? []) as SitterServiceRow[];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to my Havener profile
      </Link>

      <h1 className="mt-6 text-2xl font-semibold text-espresso-700">
        Your services
      </h1>
      <p className="mt-2 text-sm text-espresso-500">
        Turn services on or off, set rates and pause any one of them without
        touching the rest.
      </p>

      <div className="mt-8 space-y-3">
        {SERVICES.map((service) => {
          const row = rows.find((r) => r.service_type === service.type) ?? null;
          return (
            <Link
              key={service.type}
              href={`/dashboard/havener/services/${service.slug}`}
              className="flex items-center justify-between rounded-2xl border border-espresso-700/10 bg-white p-5 transition-colors hover:border-gold-500/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-espresso-700">{service.name}</p>
                  {row && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.is_active && !row.is_paused
                          ? 'bg-green-100 text-green-800'
                          : 'bg-espresso-700/8 text-espresso-600'
                      }`}
                    >
                      {row.is_paused ? 'Away' : row.is_active ? 'Active' : 'Off'}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-espresso-500">
                  {row
                    ? `${formatCents(row.base_rate_cents)} / ${service.rateUnit}`
                    : `Not set up yet — starts at ${formatCents(service.fromRate * 100)} / ${service.rateUnit}`}
                </p>
              </div>
              <IconArrowRight className="h-4 w-4 shrink-0 text-espresso-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
