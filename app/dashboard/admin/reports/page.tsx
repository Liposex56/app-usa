import type { Metadata } from 'next';
import Link from 'next/link';

import type { ProfileRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Reportes — Panel administrativo' };

type ReportRow = {
  id: string;
  booking_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};

export default async function AdminReportsPage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('booking_reports') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const reports = (data ?? []) as ReportRow[];

  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const names = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('*').in('id', reporterIds);
    for (const p of (profiles ?? []) as ProfileRow[]) {
      names.set(p.id, p.display_name || p.email || p.id);
    }
  }

  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-espresso-700/10 bg-white p-8 text-center text-sm text-espresso-500">
        Nadie ha reportado una conversación todavía.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-2xl border border-espresso-700/10 bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-espresso-700">
              {names.get(report.reporter_id) ?? report.reporter_id}
            </p>
            <p className="text-xs text-espresso-500">
              {new Date(report.created_at).toLocaleString('es-US')}
            </p>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-espresso-600">{report.reason}</p>
          <Link
            href={`/dashboard/bookings/${report.booking_id}`}
            className="mt-3 inline-block text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            Ver la conversación →
          </Link>
        </div>
      ))}
    </div>
  );
}
