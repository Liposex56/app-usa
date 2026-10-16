'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { IconCheck, IconMapPin, IconShield, IconStar } from '@/components/icons';
import { cn, formatCents } from '@/lib/utils';

import { SearchMap, type MapPin } from './search-map';

export type ResultItem = {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  location: string | null;
  rating: number | null;
  reviews: number;
  stays: number;
  rate: number | null;
  rateUnit: string;
  miles: number | null;
  /** Why this Havener is in the list — shown as chips. */
  why: string[];
  certified: boolean;
  insured: boolean;
  backgroundChecked: boolean;
  href: string;
  pin: { lat: number; lng: number } | null;
};

/** The results list and the map next to it; on phones they switch with a toggle. */
export function SearchResults({
  items,
  origin,
}: {
  items: ResultItem[];
  origin: { lat: number; lng: number } | null;
}) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [activeId, setActiveId] = useState<string | null>(null);

  const pins = useMemo<MapPin[]>(
    () =>
      items.flatMap((item, index) =>
        item.pin ? [{ id: item.id, rank: index + 1, name: item.name, ...item.pin }] : []
      ),
    [items]
  );

  function select(id: string) {
    setActiveId(id);
    document
      .getElementById(`result-${id}`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 lg:hidden" role="tablist" aria-label="Results view">
        {(['list', 'map'] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => setView(option)}
            className={cn(
              'rounded-full px-5 py-1.5 text-[17px] font-semibold transition-colors',
              view === option ? 'bg-hv-ink text-hv-cream' : 'bg-hv-paper text-espresso-700'
            )}
          >
            {option === 'list' ? 'List' : 'Map'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <ol className={cn('space-y-4', view === 'map' && 'hidden lg:block')}>
          {items.map((item, index) => (
            <li key={item.id} id={`result-${item.id}`}>
              <Link
                href={item.href}
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(item.id)}
                onBlur={() => setActiveId(null)}
                className={cn(
                  'flex gap-4 rounded-3xl border bg-hv-paper p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift',
                  activeId === item.id ? 'border-hv-ink' : 'border-espresso-700/8'
                )}
              >
                <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
                  <div className="h-full w-full overflow-hidden rounded-2xl bg-sky-100">
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.avatarUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-espresso-500">
                        {item.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <span className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-hv-cream bg-hv-ink text-[16px] font-bold text-hv-cream">
                    {index + 1}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-espresso-700">{item.name}</p>
                      {item.location && (
                        <p className="inline-flex items-center gap-1 text-[15px] text-espresso-500">
                          <IconMapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </p>
                      )}
                    </div>
                    {item.rate != null && (
                      <p className="shrink-0 text-right">
                        <span className="block text-xl font-bold text-espresso-700">
                          {formatCents(item.rate)}
                        </span>
                        <span className="block text-[14px] text-espresso-500">
                          per {item.rateUnit}
                        </span>
                      </p>
                    )}
                  </div>

                  {item.headline && (
                    <p className="mt-1.5 line-clamp-2 text-[16px] text-espresso-600">
                      {item.headline}
                    </p>
                  )}

                  <p className="mt-2 text-[15px] text-espresso-500">
                    {item.rating ? `★ ${item.rating.toFixed(1)}` : 'New Havener'} · {item.reviews}{' '}
                    review{item.reviews === 1 ? '' : 's'}
                    {item.stays > 0 ? ` · ${item.stays} stay${item.stays === 1 ? '' : 's'}` : ''}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.why.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-hv-sky/60 px-2.5 py-0.5 text-[14px] font-semibold text-espresso-700"
                      >
                        {reason}
                      </span>
                    ))}
                    {item.certified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/15 px-2.5 py-0.5 text-[14px] font-semibold text-gold-700">
                        <IconStar className="h-3 w-3" /> Certified
                      </span>
                    )}
                    {item.insured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[14px] font-semibold text-green-800">
                        <IconShield className="h-3 w-3" /> Insured
                      </span>
                    )}
                    {item.backgroundChecked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[14px] font-semibold text-green-800">
                        <IconCheck className="h-3 w-3" /> Background checked
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        <div
          className={cn(
            'flex-col lg:sticky lg:top-20 lg:flex lg:h-[calc(100vh-7rem)]',
            view === 'map' ? 'flex h-[70vh]' : 'hidden'
          )}
        >
          <div className="min-h-0 flex-1">
            <SearchMap
              pins={pins}
              origin={origin}
              activeId={activeId}
              visible={view === 'map'}
              onSelect={select}
            />
          </div>
          <p className="mt-2 text-[14px] text-espresso-500">
            Pins are approximate. A Havener’s exact address is shared only after you book.
          </p>
        </div>
      </div>
    </div>
  );
}
