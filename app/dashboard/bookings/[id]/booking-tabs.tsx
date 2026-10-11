'use client';

import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type BookingPanel = {
  id: string;
  label: string;
  /** Small count next to the label (e.g. number of updates). */
  badge?: number;
  content: ReactNode;
};

/**
 * Tabs for the right-hand side of the booking page. Every panel stays mounted
 * (just hidden), so the conversation keeps its live connection and scroll
 * position while someone looks at the service updates.
 */
export function BookingTabs({
  panels,
  initial,
  className,
}: {
  panels: BookingPanel[];
  initial?: string;
  className?: string;
}) {
  const [active, setActive] = useState(initial ?? panels[0]?.id);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {panels.length > 1 && (
        <div role="tablist" className="flex gap-1 border-b border-espresso-700/8 px-3 pt-2 sm:px-5">
          {panels.map((panel) => (
            <button
              key={panel.id}
              type="button"
              role="tab"
              aria-selected={active === panel.id}
              onClick={() => setActive(panel.id)}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[18px] font-semibold transition-colors',
                active === panel.id
                  ? 'border-hv-ink text-espresso-700'
                  : 'border-transparent text-espresso-500 hover:text-espresso-700'
              )}
            >
              {panel.label}
              {panel.badge ? (
                <span className="rounded-full bg-hv-sky px-2 py-0.5 text-xs font-bold text-hv-ink">
                  {panel.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {panels.map((panel) => (
        <div
          key={panel.id}
          role="tabpanel"
          hidden={active !== panel.id}
          className={cn('flex min-h-0 flex-1 flex-col', active !== panel.id && 'hidden')}
        >
          {panel.content}
        </div>
      ))}
    </div>
  );
}
