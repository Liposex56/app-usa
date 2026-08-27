import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconCheck, IconMapPin, IconShield, IconStar } from '@/components/icons';
import type { SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Havener profile' };

const STATUS_COPY: Record<SitterProfileRow['status'], { label: string; tone: string }> = {
  draft: { label: 'Borrador — aún no enviado', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_review: { label: 'En revisión', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Aprobado — visible para dueños', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado — edita y reenvía', tone: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspendido', tone: 'bg-red-100 text-red-800' },
};

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-espresso-700/15 px-5 py-2 text-sm font-medium text-espresso-700 transition-colors hover:border-espresso-700/30"
    >
      {children}
    </Link>
  );
}

export default async function HavenerProfilePage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_profiles')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();

  const sitter = data as SitterProfileRow | null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to dashboard
      </Link>

      {!sitter ? (
        <div className="mt-6 rounded-3xl border border-espresso-700/10 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-espresso-700">
            Crea tu perfil en Havener
          </h1>
          <p className="mt-2 text-sm text-espresso-500">
            Aún no has creado tu perfil de Havener. Complétalo para empezar a
            recibir reservas.
          </p>
          <Link
            href="/dashboard/havener/edit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gold-500 px-6 py-2.5 text-sm font-medium text-espresso-900 transition-colors hover:bg-gold-600"
          >
            Crear mi perfil
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky-100">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name ?? 'Havener'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-medium text-espresso-500">
                    {(profile.display_name ?? 'H').slice(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-espresso-700">
                  {profile.display_name ?? 'Tu perfil de Havener'}
                </h1>
                {sitter.headline && (
                  <p className="text-sm text-espresso-600">{sitter.headline}</p>
                )}
                {(sitter.service_city || sitter.service_state) && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-espresso-500">
                    <IconMapPin className="h-3.5 w-3.5" />
                    {[sitter.service_city, sitter.service_state]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COPY[sitter.status].tone}`}
            >
              {STATUS_COPY[sitter.status].label}
            </span>
          </div>

          {sitter.bio && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-espresso-600">
              {sitter.bio}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {sitter.insurance_status === 'approved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <IconShield className="h-3 w-3" /> Asegurado
              </span>
            )}
            {sitter.background_check_status === 'approved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <IconCheck className="h-3 w-3" /> Antecedentes verificados
              </span>
            )}
            {sitter.status === 'approved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                <IconStar className="h-3 w-3" /> Perfil público activo
              </span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ActionLink href="/dashboard/havener/edit">Editar perfil</ActionLink>
            {sitter.status === 'approved' && (
              <ActionLink href={`/sitters/${profile.id}`}>
                Ver mi perfil público
              </ActionLink>
            )}
            <ActionLink href="/dashboard/havener/services">
              Gestionar mis servicios
            </ActionLink>
            <ActionLink href="/dashboard/havener/insurance">
              Gestionar mi seguro
            </ActionLink>
          </div>
        </>
      )}
    </div>
  );
}
