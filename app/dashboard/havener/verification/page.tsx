import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { CheckStatus, SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

import { VerifyButton } from './verify-button';

export const metadata: Metadata = { title: 'Verificación de identidad — Havenr' };

const STATUS_COPY: Record<CheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Sin enviar', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending: { label: 'En proceso', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Verificado', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Necesita otro intento', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Vencido — vuelve a intentarlo', tone: 'bg-red-100 text-red-800' },
};

export default async function HavenerVerificationPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_profiles')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();
  const sitter = data as SitterProfileRow | null;

  const status = STATUS_COPY[sitter?.background_check_status ?? 'not_started'];
  const stripeConfigured = Boolean(getStripe());

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
          Verificación de identidad
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.tone}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-espresso-500">
        Comparamos tu identificación oficial con una selfie en vivo — es
        automático y toma un par de minutos. Es la base de la insignia
        &ldquo;Background checked&rdquo; en tu perfil público.
      </p>

      <div className="mt-8 rounded-2xl border border-espresso-700/10 bg-white p-6">
        {!stripeConfigured ? (
          <p className="rounded-xl bg-cream p-4 text-sm text-olive-700">
            La verificación todavía no está activada en Havenr — falta
            conectar la cuenta de Stripe de la empresa. En cuanto esté lista,
            vuelve aquí para verificarte.
          </p>
        ) : sitter?.background_check_status === 'approved' ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </span>
            <p className="font-medium text-espresso-700">
              Tu identidad está verificada.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-espresso-600">
              {sitter?.background_check_status === 'pending'
                ? 'Tu verificación está en proceso.'
                : 'Aún no has verificado tu identidad.'}
            </p>
            <div className="mt-4">
              <VerifyButton
                label={
                  sitter?.background_check_status === 'pending' ||
                  sitter?.background_check_status === 'rejected'
                    ? 'Volver a intentar'
                    : 'Verificar mi identidad'
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
