import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Same backgrounds as the landing's sections.
const HERO_GLOW =
  'radial-gradient(ellipse 30% 70% at 14% 70%, rgba(160,202,238,.85), rgba(194,220,244,0) 100%), ' +
  'radial-gradient(ellipse 32% 60% at 88% 18%, rgba(255,246,196,.95), rgba(255,246,196,0) 100%), ' +
  'radial-gradient(ellipse 26% 50% at 60% 110%, rgba(255,246,196,.8), rgba(255,246,196,0) 100%)';

export function Section({
  children,
  className,
  tone = 'bone',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'bone' | 'white' | 'cream' | 'espresso' | 'sky';
}) {
  const tones = {
    bone: 'bg-bone',
    white: 'bg-hv-paper',
    cream: 'bg-hv-butter',
    sky: 'bg-[linear-gradient(180deg,#d6e6f1_0%,#c6ddf3_45%,#d8e6f0_100%)]',
    espresso: 'bg-espresso-700 text-cream',
  } as const;

  return (
    <section className={cn('py-20 sm:py-24', tones[tone], className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

/** Opening band of an inner page: the landing's glow background and a big title. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-bone">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: HERO_GLOW }}
      />
      <div className="container-page relative py-16 text-center sm:py-24">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mx-auto mt-3 max-w-4xl text-[clamp(42px,7vw,92px)] leading-[0.93]">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(18px,1.6vw,23px)] font-medium leading-snug text-espresso-500">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'dark',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  tone?: 'dark' | 'light';
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        tone === 'light' && 'text-cream'
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'eyebrow',
            tone === 'light' && 'text-hv-sky'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'mt-3 text-[clamp(32px,4vw,54px)] leading-[0.98]',
          tone === 'light' && 'text-cream'
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-[19px] font-medium leading-snug text-espresso-500',
            tone === 'light' && 'text-cream/75'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
