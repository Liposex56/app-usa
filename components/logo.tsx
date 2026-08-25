import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type LogoProps = {
  /** `dark` = espresso lettering for light backgrounds. */
  tone?: 'dark' | 'cream';
  /** `full` includes the dachshund above the wordmark. */
  variant?: 'wordmark' | 'full';
  className?: string;
  width?: number;
};

const SRC = {
  'wordmark-dark': '/brand/logo-wordmark-dark.png',
  'wordmark-cream': '/brand/logo-wordmark-cream.png',
  'full-dark': '/brand/logo-full-dark.png',
  'full-cream': '/brand/logo-full-cream.png',
} as const;

/** Aspect ratios of the delivered brand files. */
const RATIO = { wordmark: 1838 / 438, full: 1838 / 869 };

export function Logo({
  tone = 'dark',
  variant = 'wordmark',
  className,
  width = 148,
}: LogoProps) {
  const src = SRC[`${variant}-${tone}` as keyof typeof SRC];
  return (
    <Image
      src={src}
      alt="Havenr"
      width={width}
      height={Math.round(width / RATIO[variant])}
      priority
      className={cn('h-auto w-auto', className)}
      style={{ width, height: 'auto' }}
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
