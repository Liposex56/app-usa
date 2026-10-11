import Link from 'next/link';

import { LogoLink } from '@/components/logo';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bone">
      <header className="sticky top-0 z-40 bg-hv-ink text-hv-cream">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-5 lg:px-[clamp(20px,4.6vw,66px)]">
          <LogoLink tone="cream" width={156} />
          <div className="flex items-center gap-5">
            <span className="hidden text-[17px] font-medium text-hv-cream/70 sm:inline">
              Your progress is saved as you go
            </span>
            <Link
              href="/dashboard"
              className="rounded-full bg-hv-sky px-6 py-1 text-[17px] font-semibold text-hv-ink transition-colors hover:bg-hv-paper"
            >
              Finish later
            </Link>
          </div>
        </div>
      </header>

      <main className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
