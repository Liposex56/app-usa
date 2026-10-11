import Link from 'next/link';

// Dark pill button with an arrow in a circle ("Find their haven").
// leading-[1.3333]: Tailwind 4's text-2xl scales its line-height with the font
// size (v3 fixes it at 2rem) and the hero overrides the size on desktop.
export function ArrowButton({
  children,
  href,
  className = '',
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-between gap-4 rounded-full bg-hv-ink py-[0.45em] pl-[0.85em] pr-[0.3em] text-2xl font-medium leading-[1.3333] text-hv-cream transition-transform hover:-translate-y-0.5 ${className}`}
    >
      <span>{children}</span>
      <span className="grid aspect-square h-[1.75em] place-items-center rounded-full bg-hv-cream text-hv-ink transition-transform group-hover:translate-x-1">
        <svg
          viewBox="0 0 24 24"
          className="h-[60%] w-[60%]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 12h17M14 5.5 20.5 12 14 18.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
