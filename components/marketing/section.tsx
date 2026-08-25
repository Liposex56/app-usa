import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

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
    white: 'bg-white',
    cream: 'bg-cream',
    sky: 'bg-sky-50',
    espresso: 'bg-espresso-700 text-cream',
  } as const;

  return (
    <section className={cn('py-20 sm:py-24', tones[tone], className)}>
      <div className="container-page">{children}</div>
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
            tone === 'light' && 'text-cream/55'
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'mt-3 text-3xl leading-[1.15] sm:text-4xl',
          tone === 'light' && 'text-cream'
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-[17px] leading-relaxed text-espresso-500',
            tone === 'light' && 'text-cream/70'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
