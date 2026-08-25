import Link from 'next/link';

import { LogoLink } from '@/components/logo';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bone">
      <header className="border-b border-espresso-700/8 bg-bone/85 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <LogoLink width={118} />
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-espresso-500 sm:inline">
              Your progress is saved as you go
            </span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-espresso-600 hover:text-espresso-700"
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
