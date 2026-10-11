import Link from 'next/link';

import { HavenrLogo } from '@/components/home/logo';
import { cn } from '@/lib/utils';

type LogoProps = {
  /** `dark` = espresso lettering for light backgrounds. */
  tone?: 'dark' | 'cream';
  /** Kept for compatibility: the wordmark is the same everywhere now. */
  variant?: 'wordmark' | 'full';
  className?: string;
  /** Approximate width in px; sets the size of the lettering. */
  width?: number;
};

/** The HAVENR wordmark of the landing, so every page carries the same logo. */
export function Logo({ tone = 'dark', className, width = 148 }: LogoProps) {
  return (
    <HavenrLogo
      className={cn(tone === 'cream' ? 'text-hv-cream' : 'text-hv-ink', className)}
      style={{ fontSize: Math.round(width / 3.9) }}
    />
  );
}

export function LogoLink({
  tone = 'dark',
  variant = 'wordmark',
  width = 132,
  className,
}: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Havenr — home"
      className={cn('inline-flex shrink-0 items-center', className)}
    >
      <Logo tone={tone} variant={variant} width={width} />
    </Link>
  );
}
