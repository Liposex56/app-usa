'use client';

import { useState } from 'react';
import Link from 'next/link';

// Small alternating tilt per resting position — matches the "hand scattered"
// look used elsewhere on the page (How It Works fan) instead of a perfectly
// even stack.
const REST_TILT = [-6, 4, -3, 6, -8];

export function ServicesStack({
  items,
}: {
  items: {
    slug: string;
    name: string;
    tagline: string;
    photo: string | null;
  }[];
}) {
  const [active, setActive] = useState(0);
  const done = active >= items.length;

  return (
    <div className="sm:hidden">
      <div className="relative mt-10 h-[28rem]">
        {items.map((item, index) => {
          const isCleared = index < active;
          const isActive = index === active;

          // Cleared cards park in a small overlapping pile to the left and
          // stay there — one at a time, in the order they were tapped —
          // while the next card takes over the centered, active spot.
          const transform = isCleared
            ? `translate(-38%, ${index * 10}px) rotate(${REST_TILT[index % REST_TILT.length]}deg) scale(0.78)`
            : isActive
              ? 'translate(0, 0) rotate(0deg) scale(1)'
              : `rotate(${REST_TILT[index % REST_TILT.length]}deg) scale(0.97)`;

          return (
            <div
              key={item.slug}
              role={isActive ? 'button' : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                if (isActive) setActive((current) => current + 1);
              }}
              onKeyDown={(event) => {
                if (isActive && (event.key === 'Enter' || event.key === ' ')) {
                  setActive((current) => current + 1);
                }
              }}
              style={{
                zIndex: isCleared ? index : items.length - index,
                transform,
              }}
              className={`absolute inset-x-6 top-0 flex h-full flex-col overflow-hidden rounded-[2.5rem] border-2 border-espresso-700/10 bg-[#D6D1C6] shadow-lift transition-transform duration-500 ease-out ${
                isActive ? 'bone-cursor' : ''
              } ${isCleared ? 'opacity-95' : ''} ${!isActive && !isCleared ? 'pointer-events-none' : ''}`}
            >
              {index === 4 && (
                <svg
                  aria-hidden
                  viewBox="0 0 64 64"
                  className="absolute right-4 top-4 z-[1] h-10 w-10 text-white/40"
                >
                  <circle cx="32" cy="40" r="12" fill="currentColor" />
                  <circle cx="14" cy="26" r="7" fill="currentColor" />
                  <circle cx="27" cy="14" r="7" fill="currentColor" />
                  <circle cx="42" cy="14" r="7" fill="currentColor" />
                  <circle cx="53" cy="27" r="7" fill="currentColor" />
                </svg>
              )}
              <div className="relative h-2/3 w-full overflow-hidden">
                {item.photo ? (
                  // Daycare's source photo faces right; Figma's card has her
                  // looking left, so it's mirrored here to match.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photo}
                    alt=""
                    aria-hidden
                    className={`h-full w-full object-cover ${
                      index === 2 || index === 4 ? 'grayscale' : ''
                    } ${index === 1 ? 'scale-x-[-1]' : ''}`}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/brand/homepage/icon-house.svg"
                    alt=""
                    aria-hidden
                    className="absolute bottom-2 right-2 h-20 w-auto opacity-70"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <h3 className="font-display text-3xl font-black uppercase text-espresso-700">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm font-bold text-espresso-500">
                  {item.tagline}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <p className="mt-6 text-center text-sm text-espresso-500">
          That’s all five —{' '}
          <Link href="/services" className="font-bold text-gold-600 underline">
            see full details
          </Link>
        </p>
      )}
    </div>
  );
}
