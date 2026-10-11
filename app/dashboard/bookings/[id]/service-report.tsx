/* eslint-disable @next/next/no-img-element */
import { timeInAppZone } from '@/lib/dates';
import {
  KIND_LABEL,
  formatDuration,
  type ServiceUpdateRow,
} from '@/lib/service-reports';
import { formatDate } from '@/lib/utils';

import { RemoveUpdateButton } from './remove-update-button';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bone px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-olive-500">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-bold text-espresso-700">{value}</dd>
    </div>
  );
}

/**
 * The timeline the owner follows live and the report they keep when the
 * service ends. Shown to both sides of the booking (and staff).
 */
export function ServiceReport({
  bookingId,
  updates,
  mediaUrls,
  status,
  startedAt,
  completedAt,
  walkMiles,
  canRemove,
}: {
  bookingId: string;
  updates: ServiceUpdateRow[];
  mediaUrls: Record<string, string>;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  /** Distance of the GPS route, for walks that recorded one. */
  walkMiles: number | null;
  canRemove: boolean;
}) {
  const completed = status === 'completed';
  const ordered = [...updates].sort((a, b) => b.created_at.localeCompare(a.created_at));

  const media = updates.filter((u) => u.media_path);
  const photos = media.filter((u) => u.media_type !== 'video').length;
  const videos = media.filter((u) => u.media_type === 'video').length;
  const potty = updates.filter((u) => u.kind === 'potty').length;
  const duration = formatDuration(startedAt, completedAt);

  return (
    <section className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg text-espresso-700">
          {completed ? 'Service report' : 'Live updates'}
        </h2>
        {!completed && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
            In progress
          </span>
        )}
      </div>

      {completed && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {duration && <Stat label="Duration" value={duration} />}
          {walkMiles !== null && walkMiles > 0 && (
            <Stat label="Distance" value={`${walkMiles.toFixed(2)} mi`} />
          )}
          <Stat
            label="Photos & videos"
            value={`${photos}${videos ? ` + ${videos}` : ''}`}
          />
          {potty > 0 && <Stat label="Potty breaks" value={String(potty)} />}
          <Stat label="Entries" value={String(updates.length)} />
        </dl>
      )}

      {ordered.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-espresso-700/15 p-5 text-center text-[17px] text-espresso-500">
          {completed
            ? 'No updates were logged for this service.'
            : 'No updates yet — the Havener’s photos and notes will appear here as they happen.'}
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {ordered.map((update) => {
            const url = mediaUrls[update.id];
            return (
              <li
                key={update.id}
                className="rounded-2xl border border-espresso-700/8 bg-bone p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[17px] font-semibold text-espresso-700">
                    {KIND_LABEL[update.kind]}
                  </p>
                  <p className="text-sm text-espresso-500">
                    {formatDate(update.created_at.slice(0, 10))} ·{' '}
                    {timeInAppZone(update.created_at)}
                  </p>
                </div>

                {update.body && (
                  <p className="mt-2 whitespace-pre-line text-[17px] text-espresso-600">
                    {update.body}
                  </p>
                )}

                {url && update.media_type === 'video' && (
                  <video
                    src={url}
                    controls
                    playsInline
                    preload="metadata"
                    className="mt-3 max-h-96 w-full rounded-xl bg-espresso-700/5"
                  />
                )}
                {url && update.media_type !== 'video' && (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={update.body ?? KIND_LABEL[update.kind]}
                      loading="lazy"
                      className="mt-3 max-h-96 w-full rounded-xl object-cover"
                    />
                  </a>
                )}

                {canRemove && (
                  <div className="mt-3 text-right">
                    <RemoveUpdateButton bookingId={bookingId} updateId={update.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
