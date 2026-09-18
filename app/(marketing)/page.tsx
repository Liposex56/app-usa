import Link from 'next/link';

import { IconShield } from '@/components/icons';
import { IntroSplash } from '@/components/marketing/intro-splash';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { SERVICES } from '@/lib/services';

const TRUST_STEPS = [
  {
    title: 'Background checked',
    body: 'A third-party criminal and identity check clears before anything else.',
    // A shade lighter than the band itself (bg-espresso-700) so this card
    // still reads as a distinct card while scrolling past.
    bg: 'bg-espresso-500',
    fg: 'text-cream',
  },
  {
    title: 'Interviewed',
    body: 'A real conversation with our team about experience and judgment.',
    // Exact color from the delivered check-panel-1-gold.svg (#BE8210 = gold-500).
    // Used as a flat fill rather than the image itself: that file also bakes in
    // a vertical "INTERVIEW" label baked into panels 2 and 3 too (an export
    // mistake upstream), which would contradict their real titles.
    bg: 'bg-gold-500',
    fg: 'text-espresso-700',
  },
  {
    title: 'Home verified',
    body: 'We visit and review the home for pets who will stay overnight.',
    // #C2DCF4 = sky-200, from check-panel-2-sky.svg.
    bg: 'bg-sky-200',
    fg: 'text-espresso-700',
  },
  {
    title: 'Insured',
    body: 'Active coverage on file, tracked and re-checked before it expires.',
    // #69532A = olive-500, from check-panel-3-olive.svg.
    bg: 'bg-olive-500',
    fg: 'text-cream',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Tell us about your pet',
    body: 'Breed, size, energy, medications, what scares them, what calms them.',
  },
  {
    step: '2',
    title: 'See only Haveners who fit',
    body: 'We hide anyone who does not accept your pet’s requirements — even if they are nearby and highly rated.',
  },
  {
    step: '3',
    title: 'Message, book and pay in one place',
    body: 'Agree the details in Havenr chat, send the request, and pay through the platform.',
  },
  {
    step: '4',
    title: 'Follow along, then get the report',
    body: 'Photos, updates and activity logs as they happen — and a full summary when the service ends.',
  },
];

// Absolute position + rotation for each How-it-works card, aligned by array
// index to HOW_IT_WORKS — an overlapping, hand-scattered fan (matching the
// master file) instead of a plain grid.
const HOW_IT_WORKS_LAYOUT: Array<{ left: string; top: string; transform: string }> = [
  { left: '0%', top: '42%', transform: 'rotate(-8deg)' },
  { left: '24%', top: '58%', transform: 'rotate(-5deg)' },
  { left: '20%', top: '0%', transform: 'rotate(5deg)' },
  { left: '58%', top: '18%', transform: 'rotate(9deg)' },
];

const FEATURES = [
  {
    wordmark: '/brand/homepage/tile-everything-in-app.svg',
    ratio: 372 / 28,
    title: 'Everything stays in the app',
    body: 'Messages, agreements and evidence live in one thread, so support can see exactly what was promised if anything goes wrong.',
  },
  {
    wordmark: '/brand/homepage/tile-updates.svg',
    ratio: 454 / 28,
    title: 'Updates you don’t have to ask for',
    body: 'Boarding and daycare Haveners are reminded to send photos and videos during the day. If nothing has arrived, we remind them again.',
  },
  {
    wordmark: '/brand/homepage/tile-walks-verify.svg',
    ratio: 416 / 28,
    title: 'Walks you can actually verify',
    body: 'GPS route, distance, duration, potty log and required photos before a walk can be marked complete.',
  },
  {
    wordmark: '/brand/homepage/tile-private-by-design.svg',
    ratio: 229 / 28,
    title: 'Private by design',
    body: 'Your address is hidden until a booking is confirmed. We never sell your location or conversations to advertisers.',
  },
  {
    wordmark: '/brand/homepage/tile-visits-checklist.svg',
    ratio: 239 / 68,
    title: 'Visits with a real checklist',
    body: 'Litter, food, water, play, medication, wellbeing check. Every task is ticked off and timestamped.',
  },
  {
    wordmark: '/brand/homepage/tile-one-clear-total.svg',
    ratio: 264 / 68,
    title: 'One clear total, no surprises',
    body: 'Service rate, add-ons, taxes and tip are itemized before you confirm. Nothing is added later without your approval.',
  },
];

const SERVICE_SWATCHES = ['bg-cream', 'bg-sky-100', 'bg-gold-50', 'bg-white', 'bg-sky-200'];

// Grid placement per service, aligned by index to SERVICES: Boarding and
// Daycare stack in column 1, House Sitting spans the full height of column
// 2 (photo on top, text pinned to the bottom), Dog Walking and Drop-In
// Visits stack in column 3 — matching the reference layout exactly.
const SERVICE_GRID_LAYOUT = [
  'sm:col-start-1 sm:row-start-1',
  'sm:col-start-1 sm:row-start-2',
  'sm:col-start-2 sm:row-start-1 sm:row-span-2',
  'sm:col-start-3 sm:row-start-1',
  'sm:col-start-3 sm:row-start-2',
];

// Column spans (of 12) per feature tile, sized to each wordmark's own width
// so the grid reads as the same uneven, bento-style rows as the master file
// instead of six identical boxes.
const FEATURE_SPANS = [
  'sm:col-span-5',
  'sm:col-span-7',
  'sm:col-span-7',
  'sm:col-span-5',
  'sm:col-span-6',
  'sm:col-span-6',
];

export default function HomePage() {
  return (
    <div
      className="relative bg-bone bg-no-repeat"
      style={{
        backgroundImage: 'url(/brand/homepage/page-background-gradient.png)',
        backgroundSize: '100% 100%',
      }}
    >
      <IntroSplash />
      <ScrollReveal />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          className="animate-blob-move absolute -left-20 -top-20 h-72 w-72 bg-gold-100/70"
          style={{ borderRadius: '44% 56% 62% 38% / 48% 42% 58% 52%' }}
        />
        <div
          className="animate-blob-move absolute -right-10 top-10 h-56 w-56 bg-sky-100/80"
          style={{
            borderRadius: '44% 56% 62% 38% / 48% 42% 58% 52%',
            animationDelay: '-4s',
          }}
        />

        <div className="container-page relative z-[2] pb-24 pt-14 sm:pt-16">
          <div className="flex justify-end">
            <Link
              href="/search"
              className="shrink-0 text-right text-xs font-bold uppercase leading-snug tracking-wide text-olive-500 underline decoration-gold-500 decoration-2 underline-offset-4 transition-colors hover:text-espresso-700"
            >
              Boston-area pet care
              <br />
              actually vetted
            </Link>
          </div>

          {/* Centered block, each line individually centered — confirmed
              against the reference screenshot (varying left/right insets
              per line, not a shared left edge). No trailing period after
              "booked in minutes" either, per the same reference. */}
          <h1 className="mt-7 text-center font-display font-black uppercase leading-[0.86] tracking-tight sm:mx-auto sm:max-w-3xl">
            <span className="block text-[2.6rem] text-espresso-700 sm:text-6xl lg:text-7xl">
              Pet <span className="text-sky-500">care</span>
            </span>
            <span className="block text-[2.6rem] text-espresso-700 sm:text-6xl lg:text-7xl">
              you can trust,
            </span>
            <span className="block text-[3rem] text-gold-500 sm:text-[4.6rem] lg:text-[6rem]">
              booked in minutes
            </span>
          </h1>

          <div className="mt-16 flex justify-end sm:mt-24">
            <Link
              href="/search"
              className="bone-cursor animate-pulse-btn inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-espresso-700 px-7 font-display text-base font-bold uppercase text-cream shadow-poster transition-transform hover:-translate-y-0.5"
            >
              Find their haven
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- A day in their haven */}
      <section className="pb-20 sm:pb-28">
        <div className="container-page" data-reveal>
          <h2 className="max-w-lg font-display text-3xl font-black uppercase leading-[0.98] text-espresso-700 sm:text-5xl">
            Every pet deserves a place that feels like home.
          </h2>
        </div>

        <div
          className="container-page relative mt-10 aspect-video overflow-hidden rounded-[2rem] bg-gradient-to-br from-olive-500 via-gold-500 to-espresso-700"
          data-reveal
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/70 bg-cream/10 backdrop-blur-sm">
              <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                <path d="M2 2.5C2 1.34 3.26 0.62 4.26 1.2L20.26 11.7C21.25 12.28 21.25 13.72 20.26 14.3L4.26 24.8C3.26 25.38 2 24.66 2 23.5V2.5Z" fill="#FFF8CD" />
              </svg>
            </span>
            <p className="font-display text-lg font-bold uppercase tracking-wide text-cream sm:text-2xl">
              A day in their haven
            </p>
            <p className="max-w-sm text-sm font-medium text-cream/75">
              Real homes. Real care. Real connection. Our hero film is in
              production — check back soon.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Services */}
      <section className="relative overflow-hidden pb-20 pt-4 sm:pb-24">
        <div className="container-page" data-reveal>
          <h2 className="sr-only">5 ways to get your pet cared for</h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/homepage/ribbon-5-ways.svg"
            alt="What we offer?… 5 ways to get your pet cared for"
            aria-hidden
            width={1578}
            height={330}
            className="hidden h-auto w-full sm:block"
          />
          <span
            aria-hidden
            className="block font-display text-3xl font-black uppercase leading-[0.94] text-espresso-700 sm:hidden"
          >
            5 ways to get your pet cared for
          </span>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/homepage/tag-boarding-daycare-housesitting-walks.svg"
            alt="Boarding · Daycare · House Sitting · Walks"
            width={334}
            height={23}
            className="mt-4 h-auto w-56 sm:mt-2"
          />
        </div>

        <div className="container-page relative mt-14 grid gap-5 sm:grid-cols-3">
          {SERVICES.map((service, i) => {
            const isHouseSitting = i === 2;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                data-reveal
                style={{ transitionDelay: `${(i + 1) * 90}ms` }}
                className={`bone-cursor group flex h-44 flex-col rounded-3xl border-2 border-espresso-700/10 p-7 text-espresso-700 shadow-card transition-transform hover:-translate-y-1 sm:h-auto ${SERVICE_GRID_LAYOUT[i]} ${SERVICE_SWATCHES[i % SERVICE_SWATCHES.length]}`}
              >
                {isHouseSitting && (
                  // Photo goes here once it's ready — reserved space, image on
                  // top with the title and tagline pinned below it.
                  <div className="mb-4 flex-1 rounded-2xl border-2 border-dashed border-espresso-700/15" />
                )}
                <h3 className="font-display text-2xl font-black uppercase">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm font-bold text-espresso-500">
                  {service.tagline}
                </p>
                {!isHouseSitting && (
                  <div className="mt-4 flex-1 rounded-2xl border-2 border-dashed border-espresso-700/15" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="container-page relative mt-5" data-reveal>
          <Link
            href="/services"
            style={{ transitionDelay: `${(SERVICES.length + 1) * 90}ms` }}
            className="bone-cursor flex flex-col rounded-3xl bg-espresso-700 p-7 text-cream shadow-card transition-transform hover:-translate-y-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <h3 className="font-display text-2xl font-black uppercase text-cream">
              Not sure which one?
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70 sm:mt-0 sm:text-right">
              Tell us about your pet and your dates. We’ll only show you
              Haveners who can genuinely take them.
            </p>
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- Trust */}
      <section className="pb-20 pt-4 sm:pb-24">
        <div className="container-page text-center" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-500 after:ml-2 after:content-['•']">
            Trust &amp; safety
          </span>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-6xl">
            Four checks. <span className="text-gold-500">No exceptions.</span>
          </h2>
        </div>

        <div
          data-reveal
          className="container-page relative mt-10 aspect-[1440/436] overflow-hidden rounded-3xl bg-espresso-700 shadow-lift"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/homepage/dachshund-mascot.png"
            alt=""
            aria-hidden
            width={2240}
            height={2429}
            className="pointer-events-none absolute -bottom-3 -right-2 z-10 h-16 w-auto sm:h-24"
          />
          {/* Continuous right-to-left card scroll, duplicated once for a
              seamless loop. */}
          <div className="animate-marquee-slow absolute inset-y-0 flex w-max items-center gap-5 py-4 pl-4">
            {[...TRUST_STEPS, ...TRUST_STEPS].map((item, index) => (
              <div
                key={index}
                className={`relative flex h-full w-[22rem] shrink-0 flex-col justify-end overflow-hidden rounded-2xl p-5 sm:w-[30rem] sm:p-7 ${item.bg}`}
              >
                <span className={`font-display text-3xl font-black sm:text-4xl ${item.fg}`}>
                  0{(index % TRUST_STEPS.length) + 1}
                </span>
                <h3 className={`mt-1 font-display text-lg font-black uppercase leading-tight sm:text-2xl ${item.fg}`}>
                  {item.title}
                </h3>
                <p className={`mt-1 max-w-xs text-xs leading-relaxed sm:text-sm ${item.fg} opacity-70`}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          data-reveal
          className="container-page mt-8 flex flex-wrap items-center gap-4 rounded-2xl border-2 border-espresso-700/10 bg-white p-6"
        >
          <IconShield className="shrink-0 text-gold-500" width={24} height={24} />
          <p className="flex-1 text-sm leading-relaxed text-espresso-500">
            A Havener who clears all four becomes a{' '}
            <strong className="font-semibold text-espresso-700">
              Certified Havener
            </strong>
            . You’ll see the badge on their profile — and you’ll never see
            their insurance document, because that stays private.
          </p>
          <Link
            href="/trust-and-safety"
            className="bone-cursor inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-espresso-700 px-4 text-sm font-medium text-espresso-700 transition-colors hover:bg-espresso-700 hover:text-cream"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="overflow-hidden pb-24 pt-4 sm:pb-28">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-espresso-700/60">
            What we offer
          </span>
          <h2 className="mt-3 max-w-md font-display text-2xl font-black uppercase leading-[0.98] text-espresso-700 sm:text-3xl">
            From “who can watch my dog?” to booked.
          </h2>
        </div>

        {/* Mobile: a simple stacked list — the overlapping fan below is desktop-only. */}
        <div className="container-page mt-12 space-y-5 sm:hidden">
          {HOW_IT_WORKS.map((item, index) => (
            <div
              key={item.step}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 110}ms` }}
              className="rounded-3xl bg-white p-6 shadow-lift"
            >
              <span className="font-display text-4xl font-black text-sky-300">
                {item.step}
              </span>
              <h3 className="mt-2 font-display text-base font-black uppercase leading-tight text-espresso-700">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-espresso-500">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop: an overlapping, hand-scattered fan of cards, like a hand of
            playing cards — matching the master file instead of a plain grid.
            Per the design file's own note, each card reveals on its own —
            one every 5 seconds — rather than all at once. */}
        <div className="container-page relative mt-16 hidden h-[36rem] sm:block">
          {HOW_IT_WORKS.map((item, index) => (
            <div
              key={item.step}
              data-reveal
              style={{
                transitionDelay: `${index * 5}s`,
                zIndex: HOW_IT_WORKS.length - index,
                ...HOW_IT_WORKS_LAYOUT[index],
              }}
              className="absolute flex h-56 w-[58%] max-w-lg flex-col rounded-3xl bg-white p-7 shadow-lift transition-transform hover:z-10 hover:-translate-y-1 lg:w-[38%]"
            >
              <span className="font-display text-6xl font-black text-sky-300">
                {item.step}
              </span>
              <h3 className="mt-3 font-display text-2xl font-black uppercase leading-tight text-espresso-700">
                {item.title}
              </h3>
            </div>
          ))}
        </div>

        <div className="container-page mt-20 sm:mt-24" data-reveal>
          <p className="font-display text-3xl font-black uppercase leading-[0.95] text-espresso-700 sm:text-5xl">
            The details that decide whether
          </p>
          <p className="mt-1 font-display text-3xl font-black uppercase leading-[0.95] text-white drop-shadow-sm sm:text-5xl">
            you sleep well.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------- Features + Final CTA */}
      <section className="pb-20 pt-16 sm:pb-28 sm:pt-20">
        <div className="container-page grid grid-cols-1 gap-4 sm:grid-cols-12">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 90}ms` }}
              className={`rounded-3xl bg-white p-6 shadow-lift ${FEATURE_SPANS[index]}`}
            >
              <h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={feature.wordmark}
                  alt={feature.title}
                  width={200}
                  height={Math.round(200 / feature.ratio)}
                  className="h-auto w-full max-w-[13rem]"
                />
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-espresso-500">
                {feature.body}
              </p>
            </div>
          ))}
        </div>

        <div className="container-page mt-16 flex justify-end gap-4 sm:mt-20" data-reveal>
          <Link
            href="/search"
            className="bone-cursor shadow-poster-light inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-sky-200 px-7 font-display text-sm font-bold uppercase text-espresso-700 transition-transform hover:-translate-y-0.5"
          >
            Find a Havener
          </Link>
          <Link
            href="/become-a-havener"
            className="bone-cursor inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-sky-200 px-7 font-display text-sm font-bold uppercase text-sky-200 transition-transform hover:-translate-y-0.5"
          >
            Become a Havener
          </Link>
        </div>

        <p
          className="container-page mt-24 max-w-4xl font-display text-2xl font-medium uppercase leading-snug text-cream sm:mt-32 sm:text-4xl"
          data-reveal
        >
          Your pet already trusts you. Let’s find someone they can trust too.
          Creating an account is free.{' '}
          <strong className="font-black">
            You only pay when you confirm a booking.
          </strong>
        </p>
      </section>
    </div>
  );
}
