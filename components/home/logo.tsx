import { cn } from '@/lib/utils';

import { CURL_PATH } from './curl-path';

// HAVENR logo built from text + the cursive "e" of the Figma (_04_Textos.svg).
// When the final one-piece SVG logo exists, replace this component.
export function Curl({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="7 13 42 68" className={className} fill="currentColor" aria-hidden="true">
      <path d={CURL_PATH} />
    </svg>
  );
}

export function HavenrLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-start font-logo font-light uppercase leading-none tracking-[0.08em]',
        className
      )}
      aria-label="Havenr"
      role="img"
    >
      <span aria-hidden="true">hav</span>
      <Curl className="mx-[0.04em] h-[1.02em] w-auto translate-y-[0.06em]" />
      <span aria-hidden="true">nr</span>
    </span>
  );
}
