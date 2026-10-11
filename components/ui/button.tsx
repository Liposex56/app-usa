import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark' | 'light';
type Size = 'sm' | 'md' | 'lg';

// Same buttons as the landing: espresso pill (primary), sky pill (secondary).
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-hv-ink text-hv-cream hover:bg-hv-cocoa active:bg-hv-cocoa',
  secondary: 'bg-hv-sky text-hv-ink hover:bg-[#acd0f0] active:bg-[#acd0f0]',
  ghost: 'text-espresso-700 hover:bg-espresso-700/5',
  dark: 'bg-hv-ink text-hv-cream hover:bg-hv-cocoa active:bg-hv-cocoa',
  // For espresso backgrounds.
  light: 'bg-hv-cream text-hv-ink hover:bg-white active:bg-white',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-5 text-[16px]',
  md: 'h-11 px-6 text-[18px]',
  lg: 'h-12 px-8 text-[19px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ' +
  'whitespace-nowrap';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </Link>
  );
}
