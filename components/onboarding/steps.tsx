import { cn } from '@/lib/utils';

export type StepKey = 'role' | 'owner_profile' | 'pet' | 'havener';

const LABELS: Record<StepKey, string> = {
  role: 'Your role',
  owner_profile: 'Your details',
  pet: 'Your pet',
  havener: 'Your Havener profile',
};

export function Steps({
  current,
  sequence,
}: {
  current: StepKey;
  sequence: StepKey[];
}) {
  const currentIndex = sequence.indexOf(current);

  return (
    <ol className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2">
      {sequence.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                done && 'bg-gold-500 text-white',
                active && 'bg-espresso-700 text-cream',
                !done && !active && 'bg-espresso-700/8 text-espresso-500'
              )}
            >
              {done ? '✓' : index + 1}
            </span>
            <span
              className={cn(
                'text-sm',
                active ? 'font-medium text-espresso-700' : 'text-espresso-500'
              )}
            >
              {LABELS[step]}
            </span>
            {index < sequence.length - 1 && (
              <span aria-hidden className="text-espresso-700/20">
                —
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl leading-tight">{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-espresso-500">
        {description}
      </p>
    </div>
  );
}

export function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card sm:p-7">
      <legend className="px-2 text-sm font-semibold uppercase tracking-[0.12em] text-olive-500">
        {legend}
      </legend>
      {hint && (
        <p className="mb-5 mt-1 text-sm leading-relaxed text-espresso-500">
          {hint}
        </p>
      )}
      <div className={cn('space-y-5', !hint && 'mt-5')}>{children}</div>
    </fieldset>
  );
}
