import type { Metadata } from 'next';

import type { CheckStatus, ProfileRow, SitterInsuranceRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

import { ReviewButtons } from './review-buttons';

export const metadata: Metadata = { title: 'Seguros — Panel administrativo' };

const STATUS_COPY: Record<CheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Sin enviar', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending: { label: 'Pendiente', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Aprobado', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazado', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Vencido', tone: 'bg-red-100 text-red-800' },
};

export default async function AdminInsurancePage() {
  const supabase = await createClient();

  const { data: submissions } = await supabase
    .from('sitter_insurance')
    .select('*')
    .neq('status', 'not_started')
    .order('updated_at', { ascending: false });

  const rows = (submissions ?? []) as SitterInsuranceRow[];
  const sitterIds = rows.map((row) => row.sitter_id);

  const profilesById = new Map<string, ProfileRow>();
  if (sitterIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', sitterIds);
    for (const p of (profiles ?? []) as ProfileRow[]) profilesById.set(p.id, p);
  }

  const documentUrls = new Map<string, string>();
  for (const row of rows) {
    if (!row.document_path) continue;
    const { data: signed } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(row.document_path, 60 * 10);
    if (signed?.signedUrl) documentUrls.set(row.sitter_id, signed.signedUrl);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
        Ningún Havener ha enviado información de seguro todavía.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const havener = profilesById.get(row.sitter_id);
        const status = STATUS_COPY[row.status];
        const docUrl = documentUrls.get(row.sitter_id);

        return (
          <div
            key={row.sitter_id}
            className="flex flex-col gap-4 rounded-2xl border border-espresso-700/10 bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <p className="font-medium text-espresso-700">
                  {havener?.display_name ||
                    `${havener?.first_name ?? ''} ${havener?.last_name ?? ''}`.trim() ||
                    row.sitter_id}
                </p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.tone}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-espresso-500">
                {row.provider ?? 'Aseguradora no indicada'} · Póliza{' '}
                {row.policy_number ?? '—'}
              </p>
              <p className="text-sm text-espresso-500">
                {row.coverage_type ?? 'Cobertura no indicada'} · Vigencia{' '}
                {formatDate(row.effective_date)} – {formatDate(row.expires_at)}
              </p>
              {docUrl ? (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  Ver documento adjunto →
                </a>
              ) : (
                <p className="text-sm text-espresso-500/70">Sin documento adjunto</p>
              )}
            </div>

            {row.status === 'pending' && <ReviewButtons sitterId={row.sitter_id} />}
          </div>
        );
      })}
    </div>
  );
}
