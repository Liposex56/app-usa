import { PAWSITIVE_VIBES_URL } from '@/lib/partners';

/** "Bring what your pet needs" — shown to the owner once a booking is confirmed. */
export function PartnerShopCard({ petNames }: { petNames: string }) {
  return (
    <div className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-5 shadow-card">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-olive-500">
        Pawsitive Vibes
      </p>
      <h2 className="mt-1 text-xl leading-tight text-espresso-700">
        Bring what {petNames || 'your pet'} needs for the stay
      </h2>
      <p className="mt-2 text-[17px] leading-snug text-espresso-600">
        ID tags with a QR code that shares where it was scanned, collars, leashes and
        travel bowls — for their safety and comfort while they’re away.
      </p>
      <a
        href={PAWSITIVE_VIBES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-hv-ink px-6 text-[18px] font-semibold text-hv-cream transition-colors hover:bg-hv-cocoa"
      >
        Visit the shop
      </a>
    </div>
  );
}
