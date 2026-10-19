import { DashboardNav } from '@/components/dashboard-nav';
import { LogoLink } from '@/components/logo';
import type { NavLink } from '@/lib/nav';

/** The espresso bar a signed-in person sees on every page. */
export function SignedInHeader({
  links,
  name,
  unread = 0,
}: {
  links: NavLink[];
  name: string;
  /** Notifications not opened yet, for the bell. */
  unread?: number;
}) {
  return (
    <header className="sticky top-0 z-50 bg-hv-ink text-hv-cream">
      <div className="relative mx-auto flex h-14 max-w-[1440px] items-center px-5 lg:px-[clamp(20px,4.6vw,66px)]">
        <LogoLink tone="cream" width={156} />
        <DashboardNav links={links} name={name} unread={unread} />
      </div>
    </header>
  );
}
