import Link from 'next/link';

import {
  IconCamera,
  IconCard,
  IconChat,
  IconClipboard,
  IconHome,
  IconLock,
  IconPaw,
  IconRoute,
  IconShield,
} from '@/components/icons';
import { CountUp } from '@/components/marketing/count-up';
import { IntroSplash } from '@/components/marketing/intro-splash';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { SERVICES } from '@/lib/services';

const TRUST_STEPS = [
  {
    title: 'Background checked',
    body: 'A third-party criminal and identity check clears before anything else.',
    icon: IconShield,
    bg: 'bg-espresso-700',
    fg: 'text-cream',
    sub: 'text-cream/65',
  },
  {
    title: 'Interviewed',
    body: 'A real conversation with our team about experience and judgment.',
    icon: IconChat,
    bg: 'bg-gold-500',
    fg: 'text-espresso-700',
    sub: 'text-espresso-700/70',
  },
  {
    title: 'Home verified',
    body: 'We visit and review the home for pets who will stay overnight.',
    icon: IconHome,
    bg: 'bg-sky-200',
    fg: 'text-espresso-700',
    sub: 'text-espresso-700/70',
  },
  {
    title: 'Insured',
    body: 'Active coverage on file, tracked and re-checked before it expires.',
    icon: IconLock,
    bg: 'bg-olive-500',
    fg: 'text-cream',
    sub: 'text-cream/65',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Tell us about your pet',
    body: 'Breed, size, energy, medications, what scares them, what calms them.',
    rotate: '-rotate-3',
  },
  {
    step: '2',
    title: 'See only Haveners who fit',
    body: 'We hide anyone who does not accept your pet’s requirements — even if they are nearby and highly rated.',
    rotate: 'rotate-2',
  },
  {
    step: '3',
    title: 'Message, book and pay in one place',
    body: 'Agree the details in Havenr chat, send the request, and pay through the platform.',
    rotate: '-rotate-2',
  },
  {
    step: '4',
    title: 'Follow along, then get the report',
    body: 'Photos, updates and activity logs as they happen — and a full summary when the service ends.',
    rotate: 'rotate-3',
  },
];

const FEATURES = [
  {
    icon: IconChat,
    title: 'Everything stays in the app',
    body: 'Messages, agreements and evidence live in one thread, so support can see exactly what was promised if anything goes wrong.',
  },
  {
    icon: IconCamera,
    title: 'Updates you don’t have to ask for',
    body: 'Boarding and daycare Haveners are reminded to send photos and videos during the day. If nothing has arrived, we remind them again.',
  },
  {
    icon: IconRoute,
    title: 'Walks you can actually verify',
    body: 'GPS route, distance, duration, potty log and required photos before a walk can be marked complete.',
  },
  {
    icon: IconLock,
    title: 'Private by design',
    body: 'Your address is hidden until a booking is confirmed. We never sell your location or conversations to advertisers.',
  },
  {
    icon: IconClipboard,
    title: 'Visits with a real checklist',
    body: 'Litter, food, water, play, medication, wellbeing check. Every task is ticked off and timestamped.',
  },
  {
    icon: IconCard,
    title: 'One clear total, no surprises',
    body: 'Service rate, add-ons, taxes and tip are itemized before you confirm. Nothing is added later without your approval.',
  },
];

const SERVICE_SWATCHES = ['bg-cream', 'bg-sky-100', 'bg-gold-50', 'bg-white', 'bg-sky-200'];

export default function HomePage() {
  return (
    <>
      <IntroSplash />
      <ScrollReveal />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-bone">
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

        <div className="container-page relative z-[2] pb-16 pt-14 sm:pt-16">
          <div className="flex items-start justify-between gap-4">
            <span className="animate-bob inline-flex -rotate-2 items-center gap-2 border-2 border-espresso-700 bg-espresso-700 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-cream">
              <IconShield width={14} height={14} />
              Background checked · Interviewed · Home verified · Insured
            </span>

            <Link
              href="/search"
              className="hidden shrink-0 text-right text-xs font-bold uppercase leading-snug tracking-wide text-olive-500 underline decoration-gold-500 decoration-2 underline-offset-4 transition-colors hover:text-espresso-700 sm:block"
            >
              Pet care near you
              <br />
              actually vetted
            </Link>
          </div>

          <h1 className="mt-7 font-display font-black uppercase leading-[0.86] tracking-tight">
            <span className="block text-[2.6rem] text-espresso-700 sm:text-6xl lg:text-7xl">
              Pet <span className="text-sky-500">care</span>
            </span>
            <span className="block text-[2.6rem] text-espresso-700 sm:text-6xl lg:text-7xl">
              you can trust,
            </span>
            <span className="block text-[3rem] text-gold-500 sm:text-[4.6rem] lg:text-[6rem]">
              booked in minutes.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg font-semibold leading-relaxed text-espresso-500">
            Boarding, daycare, house sitting, walks and drop-in visits with
            Haveners who earned their place. Every stay comes with photos,
            updates and a report — not a shrug.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/search"
              className="bone-cursor animate-pulse-btn inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-espresso-700 px-7 font-display text-base font-bold uppercase text-cream shadow-poster transition-transform hover:-translate-y-0.5"
            >
              Find a Havener
            </Link>
            <Link
              href="/become-a-havener"
              className="bone-cursor inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-espresso-700 bg-transparent px-7 font-display text-base font-bold uppercase text-espresso-700 transition-transform hover:-translate-y-0.5"
            >
              Become a Havener
            </Link>
          </div>

          <dl className="mt-12 flex max-w-lg flex-wrap gap-x-10 gap-y-6">
            {[
              [4, 'checks', 'before a Havener can take a booking'],
              [5, 'services', 'from a 20-minute visit to a two-week stay'],
              [0, 'data sold', 'to advertisers, ever'],
            ].map(([count, noun, label]) => (
              <div key={noun as string}>
                <dt className="font-display text-3xl font-black text-espresso-700">
                  <CountUp target={count as number} /> {noun}
                </dt>
                <dd className="mt-1 max-w-[10rem] text-xs font-bold uppercase tracking-wide text-olive-500">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- A day in their haven */}
      <section className="bg-bone pb-20 sm:pb-28">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-500 after:ml-2 after:content-['•']">
            A day in their haven
          </span>
          <h2 className="mt-3 max-w-lg font-display text-3xl font-black uppercase leading-[0.98] text-espresso-700 sm:text-5xl">
            Every pet deserves a place that feels like home.
          </h2>
        </div>

        <div
          className="container-page relative mt-10 aspect-video overflow-hidden rounded-[2rem] bg-gradient-to-br from-olive-500 via-gold-500 to-espresso-700"
          data-reveal
        >
          <IconPaw
            className="absolute -left-6 -top-8 h-40 w-40 text-cream/10"
            fill="currentColor"
            stroke="none"
          />
          <IconPaw
            className="absolute -bottom-10 right-4 h-52 w-52 text-cream/10"
            fill="currentColor"
            stroke="none"
          />
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
      <section className="relative overflow-hidden bg-bone pb-20 pt-4 sm:pb-24">
        <div className="container-page" data-reveal>
          <svg
            viewBox="0 0 1578 330"
            className="pointer-events-none absolute left-1/2 top-4 hidden w-[110%] max-w-none -translate-x-1/2 opacity-90 sm:block"
            fill="none"
            aria-hidden
          >
            <path
              d="M69.8035 75.8231C174.803 64.8229 246.803 81.8234 280.803 96.8231C311.382 110.313 416.803 163.822 400.803 219.822C384.803 275.822 338.803 274.822 338.803 246.822C338.803 207.427 417.235 136.507 554.803 96.8231C606.803 81.8228 672.803 59.8227 922.803 64.8227C1170.75 69.7818 1464.8 208.823 1534.8 291.823"
              stroke="#C2DCF4"
              strokeWidth="26"
            />
          </svg>

          <span className="relative font-display text-sm font-bold uppercase tracking-widest text-gold-500">
            What we offer?…
          </span>
          <h2 className="relative mt-3 max-w-md -rotate-1 font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-5xl">
            5 ways to get your pet cared for
          </h2>
        </div>

        <div className="container-page relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              data-reveal
              style={{ transitionDelay: `${(i + 1) * 90}ms` }}
              className={`bone-cursor group flex flex-col rounded-3xl border-2 border-espresso-700/10 p-7 text-espresso-700 shadow-card transition-transform hover:-translate-y-1 ${SERVICE_SWATCHES[i % SERVICE_SWATCHES.length]}`}
            >
              <h3 className="font-display text-2xl font-black uppercase">
                {service.name}
              </h3>
              <p className="mt-2 text-sm font-bold text-espresso-500">
                {service.tagline}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-espresso-500">
                {service.description}
              </p>
              <p className="mt-6 inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase text-espresso-700 transition-colors group-hover:text-gold-600">
                Learn more
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </p>
            </Link>
          ))}

          <Link
            href="/services"
            data-reveal
            style={{ transitionDelay: `${(SERVICES.length + 1) * 90}ms` }}
            className="bone-cursor flex flex-col justify-center rounded-3xl bg-espresso-700 p-7 text-cream shadow-card transition-transform hover:-translate-y-1"
          >
            <h3 className="font-display text-2xl font-black uppercase text-cream">
              Not sure which one?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              Tell us about your pet and your dates. We’ll only show you
              Haveners who can genuinely take them.
            </p>
          </Link>
        </div>
      </section>

      {/* --------------------------------------------------------------- Trust */}
      <section className="bg-bone pb-20 pt-4 sm:pb-24">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-500 after:ml-2 after:content-['•']">
            Trust &amp; safety
          </span>
          <h2 className="mt-3 max-w-lg font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-5xl">
            Four checks. <span className="text-gold-500">No exceptions.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-espresso-500">
            Being nearby and cheap is not enough to care for someone’s pet. A
            Havener clears all four steps before a single booking reaches
            them.
          </p>
        </div>

        <div className="container-page mt-10 overflow-hidden rounded-[2rem] shadow-lift">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {TRUST_STEPS.map((item, index) => (
              <div
                key={item.title}
                data-reveal
                style={{ transitionDelay: `${(index + 1) * 120}ms` }}
                className={`relative flex min-h-[15rem] flex-col justify-between p-5 sm:min-h-[19rem] sm:p-6 ${item.bg}`}
              >
                <item.icon className={item.fg} width={22} height={22} />
                <div>
                  <span className={`font-display text-xs font-black uppercase tracking-[0.14em] ${item.fg}`}>
                    0{index + 1}
                  </span>
                  <h3 className={`mt-1 font-display text-lg font-black uppercase leading-tight ${item.fg}`}>
                    {item.title}
                  </h3>
                  <p className={`mt-2 hidden text-xs leading-relaxed sm:block ${item.sub}`}>
                    {item.body}
                  </p>
                </div>
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
      <section className="overflow-hidden bg-gradient-to-b from-bone via-sky-100 to-sky-200 pb-24 pt-4 sm:pb-28">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-espresso-700/60">
            What we offer
          </span>
          <h2 className="mt-3 max-w-lg font-display text-3xl font-black uppercase leading-[0.98] text-espresso-700 sm:text-5xl">
            From “who can watch my dog?” to booked.
          </h2>
        </div>

        <div className="container-page relative mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 sm:gap-y-6 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => (
            <div
              key={item.step}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 110}ms` }}
              className={index % 2 === 1 ? 'sm:mt-10' : ''}
            >
              <div
                className={`relative rounded-3xl bg-white p-6 shadow-lift transition-transform hover:-translate-y-1 ${item.rotate}`}
              >
                <span className="font-display text-5xl font-black text-sky-300">
                  {item.step}
                </span>
                <h3 className="mt-2 font-display text-base font-black uppercase leading-tight text-espresso-700">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-espresso-500">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="container-page mt-20 text-center sm:mt-24" data-reveal>
          <p className="font-display text-3xl font-black uppercase leading-[0.95] text-espresso-700 sm:text-5xl">
            The details that decide whether
          </p>
          <p className="mt-1 font-display text-3xl font-black uppercase leading-[0.95] text-white drop-shadow-sm sm:text-5xl">
            you sleep well.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------- Features + Final CTA */}
      <section className="bg-gradient-to-b from-sky-200 via-gold-800 to-espresso-700 pb-20 pt-16 sm:pb-28 sm:pt-20">
        <div className="container-page grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 90}ms` }}
              className="rounded-3xl bg-white p-6 shadow-lift"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                <feature.icon />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold uppercase text-espresso-700">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {feature.body}
              </p>
            </div>
          ))}
        </div>

        <div className="container-page mt-20 text-center sm:mt-28" data-reveal>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-black uppercase leading-[0.92] text-cream sm:text-5xl">
            Your pet already trusts you. Let’s find someone they can trust
            too.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] font-semibold leading-relaxed text-cream/70">
            Creating an account is free. You only pay when you confirm a
            booking.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
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
        </div>
      </section>
    </>
  );
}
