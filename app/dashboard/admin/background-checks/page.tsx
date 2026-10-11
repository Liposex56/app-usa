import type { Metadata } from 'next';

import type { CheckStatus, ProfileRow, SitterProfileRow } from '@/lib/database.types';
import {
  checkrConfigured,
  effectiveBackgroundStatus,
  type BackgroundCheckStatus,
} from '@/lib/checkr';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

import { DecisionButtons } from './decision-buttons';

export const metadata: Metadata = { title: 'Background checks — Admin panel' };

type CheckRow = {
  sitter_id: string;
  provider: 'checkr' | 'manual';
  status: BackgroundCheckStatus;
  invited_at: string | null;
  completed_at: string | null;
  note: string | null;
};

const STATUS_COPY: Record<BackgroundCheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Not started', tone: 'bg-espresso-700/8 text-espresso-600' },
  invited: { label: 'Invited', tone: 'bg-hv-butter text-olive-600' },
  processing: { label: 'Processing', tone: 'bg-hv-butter text-olive-600' },
  clear: { label: 'Clear', tone: 'bg-green-100 text-green-800' },
  consider: { label: 'Needs review', tone: 'bg-gold-500/20 text-gold-700' },
  rejected: { label: 'Not approved', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', tone: 'bg-red-100 text-red-800' },
};

const IDENTITY_LABEL: Record<CheckStatus, string> = {
  not_started: 'Identity: not started',
  pending: 'Identity: in progress',
  approved: 'Identity: verified',
  rejected: 'Identity: failed',
  expired: 'Identity: expired',
};

// What needs a person first.
const ORDER: BackgroundCheckStatus[] = [
  'consider',
  'processing',
  'invited',
  'not_started',
  'expired',
  'rejected',
  'clear',
];

export default async function AdminBackgroundChecksPage() {
  const supabase = await createClient();

  const [{ data: sitterRows }, { data: checkRows }] = await Promise.all([
    supabase.from('sitter_profiles').select('*'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('background_checks') as any).select('*'),
  ]);

  const sitters = (sitterRows ?? []) as SitterProfileRow[];
  const checks = new Map<string, CheckRow>();
  for (const row of (checkRows ?? []) as CheckRow[]) checks.set(row.sitter_id, row);

  const profilesById = new Map<string, ProfileRow>();
  if (sitters.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', sitters.map((s) => s.id));
    for (const p of (profiles ?? []) as ProfileRow[]) profilesById.set(p.id, p);
  }

  const rows = sitters
    .map((sitter) => ({
      sitter,
      check: checks.get(sitter.id) ?? null,
      status: effectiveBackgroundStatus(checks.get(sitter.id) ?? null, sitter.background_check_status),
    }))
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-hv-sky/30 p-4 text-[17px] text-espresso-700">
        {checkrConfigured()
          ? 'Automatic checks are on: Havener results arrive on their own. “Needs review” results wait here for a person — never reject automatically, and use the screening provider’s dashboard for the required adverse-action notices.'
          : 'Automatic checks aren’t connected yet (no CHECKR_API_KEY). Run the check outside Havenr and record the result here — marking clear turns on the public “Background checked” badge.'}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-[17px] text-espresso-500">
          There are no Haveners yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ sitter, check, status }) => {
            const person = profilesById.get(sitter.id);
            const copy = STATUS_COPY[status];
            return (
              <div
                key={sitter.id}
                className="flex flex-col gap-4 rounded-2xl border border-espresso-700/10 bg-hv-paper p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[18px] font-semibold text-espresso-700">
                      {person?.display_name ||
                        `${person?.first_name ?? ''} ${person?.last_name ?? ''}`.trim() ||
                        sitter.id}
                    </p>
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${copy.tone}`}>
                      {copy.label}
                    </span>
                  </div>
                  <p className="text-[16px] text-espresso-500">
                    {person?.email ?? '—'}
                    {' · '}
                    {IDENTITY_LABEL[sitter.identity_status ?? 'not_started']}
                  </p>
                  <p className="text-[16px] text-espresso-500">
                    {check
                      ? `${check.provider === 'checkr' ? 'Checkr' : 'Recorded by staff'}${
                          check.invited_at ? ` · invited ${formatDate(check.invited_at.slice(0, 10))}` : ''
                        }${
                          check.completed_at
                            ? ` · finished ${formatDate(check.completed_at.slice(0, 10))}`
                            : ''
                        }`
                      : 'No check started'}
                  </p>
                  {check?.note && (
                    <p className="text-[16px] text-espresso-600">Note: {check.note}</p>
                  )}
                </div>

                <DecisionButtons sitterId={sitter.id} status={status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
