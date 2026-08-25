import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { CheckStatus, SitterInsuranceRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

import { InsuranceForm } from './insurance-form';

export const metadata: Metadata = { title: 'Seguro — Havenr' };

const STATUS_COPY: Record<CheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Sin enviar', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending: { label: 'En revisión', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Aprobado', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado — vuelve a enviarlo', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Vencido — vuelve a enviarlo', tone: 'bg-red-100 text-red-800' },
};

export default async function HavenerInsurancePage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note in dashboard/admin/insurance/actions.ts
  const insuranceTable = supabase.from('sitter_insurance') as any;
  const { data: insurance }: { data: SitterInsuranceRow | null } = await insuranceTable
    .select('*')
    .eq('sitter_id', profile.id)
    .maybeSingle();

  const status = STATUS_COPY[insurance?.status ?? 'not_started'];

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Volver a mi perfil de Havener
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-espresso-700">
          Seguro de responsabilidad civil
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-espresso-500">
        Havenr requiere que cada Havener cuente con seguro vigente. Esta
        información es privada — los dueños sólo ven la insignia
        &ldquo;Insured&rdquo; una vez que el staff la aprueba.
      </p>

      <div className="mt-8 rounded-2xl border border-espresso-700/10 bg-white p-6">
        <InsuranceForm existing={insurance} />
      </div>
    </div>
  );
}
