'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { IconMapPin } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';

import { contactAdditionalHavenersAction, type ContactState } from '../actions';

const INITIAL: ContactState = { error: null };

export type AdditionalHavener = {
  id: string;
  name: string;
  location: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reviewCount: number;
  totalLabel: string;
  previewHref: string;
};

function Submit({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending || count === 0}>
      {pending
        ? 'Sending…'
        : `Contact ${count} Havener${count === 1 ? '' : 's'}`}
    </Button>
  );
}

export function AdditionalHaveners({
  bookingId,
  haveners,
  skipHref,
}: {
  bookingId: string;
  haveners: AdditionalHavener[];
  skipHref: string;
}) {
  const action = contactAdditionalHavenersAction.bind(null, bookingId);
  const [state, formAction] = useActionState(action, INITIAL);
  // They all start ticked — one tap on "Contact" reaches everyone.
  const [selected, setSelected] = useState<string[]>(haveners.map((h) => h.id));

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  return (
    <form action={formAction} className="pb-36">
      <FormError message={state.error} />

      <div className="space-y-3">
        {haveners.map((havener) => {
          const checked = selected.includes(havener.id);
          return (
            <div
              key={havener.id}
              className="rounded-2xl border border-espresso-700/10 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sky-100">
                  {havener.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={havener.avatarUrl}
                      alt={havener.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-medium text-espresso-500">
                      {havener.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-espresso-700">{havener.name}</p>
                  {havener.location && (
                    <p className="inline-flex items-center gap-1 text-xs text-espresso-500">
                      <IconMapPin className="h-3.5 w-3.5" />
                      {havener.location}
                    </p>
                  )}
                  <p className="text-xs text-espresso-500">
                    {havener.rating ? `★ ${havener.rating.toFixed(1)}` : 'New Havener'} ·{' '}
                    {havener.reviewCount} review{havener.reviewCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs font-medium text-green-700">{havener.totalLabel}</p>
                </div>
                <input
                  type="checkbox"
                  name="sitterIds"
                  value={havener.id}
                  checked={checked}
                  onChange={() => toggle(havener.id)}
                  aria-label={`Contact ${havener.name}`}
                  className="h-6 w-6 shrink-0 accent-espresso-700"
                />
              </div>
              <Link
                href={havener.previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex h-9 items-center justify-center rounded-full border border-espresso-700/25 text-sm font-medium text-espresso-700 hover:bg-bone"
              >
                Preview profile
              </Link>
            </div>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-espresso-700/10 bg-bone/95 backdrop-blur">
        <div className="container-page max-w-2xl space-y-2 py-3">
          <Submit count={selected.length} />
          <Link
            href={skipHref}
            className="block text-center text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            Skip this recommended step
          </Link>
        </div>
      </div>
    </form>
  );
}
