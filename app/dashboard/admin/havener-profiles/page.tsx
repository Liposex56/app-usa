import type { Metadata } from 'next';

import type { ProfileRow, SitterProfileRow, SitterServiceRow } from '@/lib/database.types';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';

import { ProfileReviewButtons } from './review-buttons';

export const metadata: Metadata = { title: 'Perfiles de Havener — Panel administrativo' };

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Borrador', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_review: { label: 'En revisión', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Aprobado', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado', tone: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspendido', tone: 'bg-red-100 text-red-800' },
};

const ORDER = ['pending_review', 'draft', 'rejected', 'suspended', 'approved'];

export default async function AdminHavenerProfilesPage() {
  const supabase = await createClient();

  const { data } = await supabase.from('sitter_profiles').select('*');
  const sitters = ((data ?? []) as SitterProfileRow[]).sort(
    (a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)
  );

  const ids = sitters.map((s) => s.id);
  const profilesById = new Map<string, ProfileRow>();
  const servicesById = new Map<string, SitterServiceRow[]>();
  if (ids.length > 0) {
    const [{ data: profiles }, { data: services }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      supabase.from('sitter_services').select('*').in('sitter_id', ids),
    ]);
    for (const p of (profiles ?? []) as ProfileRow[]) profilesById.set(p.id, p);
    for (const s of (services ?? []) as SitterServiceRow[]) {
      servicesById.set(s.sitter_id, [...(servicesById.get(s.sitter_id) ?? []), s]);
    }
  }

  if (sitters.length === 0) {
    return (
      <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
        Todavía no hay perfiles de Havener.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sitters.map((sitter) => {
        const person = profilesById.get(sitter.id);
        const status = STATUS_COPY[sitter.status] ?? STATUS_COPY.draft;
        const services = servicesById.get(sitter.id) ?? [];

        return (
          <div
            key={sitter.id}
            className="flex flex-col gap-4 rounded-2xl border border-espresso-700/10 bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-espresso-700">
                  {person?.display_name ||
                    `${person?.first_name ?? ''} ${person?.last_name ?? ''}`.trim() ||
                    sitter.id}
                </p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-espresso-500">
                {[sitter.service_city, sitter.service_state].filter(Boolean).join(', ') ||
                  'Sin ciudad'}
                {person?.email ? ` · ${person.email}` : ''}
              </p>
              {sitter.headline && (
                <p className="text-sm text-espresso-600">{sitter.headline}</p>
              )}
              <p className="text-sm text-espresso-500">
                {services.length > 0
                  ? services.map((s) => serviceName(s.service_type)).join(' · ')
                  : 'Sin servicios publicados'}
              </p>
              {sitter.status === 'rejected' && sitter.rejection_reason && (
                <p className="text-sm text-red-700">Motivo: {sitter.rejection_reason}</p>
              )}
            </div>

            {sitter.status !== 'approved' && (
              <ProfileReviewButtons
                sitterId={sitter.id}
                canReject={sitter.status === 'pending_review'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
