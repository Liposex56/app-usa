import { HavenerNav } from '@/components/havener-nav';

/**
 * Everything a Havener manages lives behind one side navigation, so the
 * pages use the width of the screen instead of a narrow column.
 */
export default function HavenerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <HavenerNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
