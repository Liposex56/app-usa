import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { SitterAvailabilityRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

import { BlockDatesForm } from './block-dates-form';
import { UnblockButton } from './unblock-button';

export const metadata: Metadata = { title: 'Mi disponibilidad — Havenr' };

type Range = { startDate: string; endDate: string; note: string | null };

/** Collapses consecutive blocked dates (same note) into ranges for display. */
function groupIntoRanges(rows: SitterAvailabilityRow[]): Range[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const ranges: Range[] = [];

  for (const row of sorted) {
    const last = ranges[ranges.length - 1];
    const prevDay = new Date(`${row.date}T00:00:00Z`);
    prevDay.setUTCDate(prevDay.getUTCDate() - 1);
    const prevDayStr = prevDay.toISOString().slice(0, 10);

    if (last && last.endDate === prevDayStr && last.note === row.note) {
      last.endDate = row.date;
    } else {
      ranges.push({ startDate: row.date, endDate: row.date, note: row.note });
    }
  }

  return ranges;
}

export default async function HavenerAvailabilityPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('sitter_availability')
    .select('*')
    .eq('sitter_id', profile.id)
    .eq('is_available', false)
    .gte('date', today)
    .order('date', { ascending: true });

  const blocked = (data ?? []) as SitterAvailabilityRow[];
  const ranges = groupIntoRanges(blocked);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Volver a mi perfil de Havener
      </Link>

      <h1 className="mt-6 text-xl font-semibold text-espresso-700">
        Mi disponibilidad
      </h1>
      <p className="mt-2 text-sm text-espresso-500">
        Bloquea los días en los que no puedes recibir reservas — vacaciones,
        compromisos personales, lo que sea. Mientras un día no esté
        bloqueado ni tengas otra reserva confirmada esas fechas, los dueños
        te van a poder encontrar y reservar directamente.
      </p>

      <div className="mt-8 rounded-2xl border border-espresso-700/10 bg-white p-6">
        <h2 className="text-sm font-medium text-espresso-700">
          Bloquear fechas
        </h2>
        <div className="mt-4">
          <BlockDatesForm />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-espresso-700">
          Días bloqueados ({ranges.length})
        </h2>
        {ranges.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-espresso-700/15 bg-white p-6 text-center text-sm text-espresso-500">
            No tienes ningún día bloqueado.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {ranges.map((range) => (
              <div
                key={`${range.startDate}-${range.endDate}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-espresso-700/8 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-medium text-espresso-700">
                    {range.startDate === range.endDate
                      ? formatDate(range.startDate)
                      : `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`}
                  </p>
                  {range.note && (
                    <p className="mt-0.5 text-xs text-espresso-500">{range.note}</p>
                  )}
                </div>
                <UnblockButton startDate={range.startDate} endDate={range.endDate} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
