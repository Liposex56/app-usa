'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAYMENTS_HREF = '/dashboard/havener/payments';

/**
 * Shown at the top of a Havener's dashboard until they have connected their
 * payout account: owners can't pay (so can't confirm a booking) until then.
 */
export function PayoutsBanner() {
  const pathname = usePathname();
  // The payments page already says it all.
  if (pathname.startsWith(PAYMENTS_HREF)) return null;

  return (
    <div className="border-b border-espresso-700/10 bg-hv-butter">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-[17px] text-olive-700">
          <strong>Connect your payments to get paid.</strong> Owners can’t confirm a booking
          with you until you do — it takes a few minutes.
        </p>
        <Link
          href={PAYMENTS_HREF}
          className="rounded-full bg-hv-ink px-5 py-2 text-[17px] font-semibold text-hv-cream hover:opacity-90"
        >
          Connect payments
        </Link>
      </div>
    </div>
  );
}
