import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import type { SitterProfileRow, SitterServiceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { commissionPercentFromSettings } from '@/lib/payments';
import { serviceBySlug } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';

import { ServiceSettingsForm } from './service-settings-form';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  return { title: service ? `${service.name} settings · Havenr` : 'Havenr' };
}

export default async function ServiceSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();

  const [
    { data: serviceRow },
    { data: sitterProfile },
    { data: settings },
  ] = await Promise.all([
      supabase
        .from('sitter_services')
        .select('*')
        .eq('sitter_id', profile.id)
        .eq('service_type', service.type)
        .maybeSingle(),
      supabase
        .from('sitter_profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle(),
      supabase
        .from('platform_settings')
        .select('company_commission_percent')
        .eq('id', 1)
        .maybeSingle(),
    ]);

  if (!sitterProfile) redirect('/dashboard/havener');

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/havener/services"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to your services
      </Link>

      <ServiceSettingsForm
        service={service}
        existing={serviceRow as SitterServiceRow | null}
        sitterProfile={sitterProfile as SitterProfileRow}
        commissionPercent={commissionPercentFromSettings(settings)}
      />
    </div>
  );
}
