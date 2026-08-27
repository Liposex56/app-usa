import Link from 'next/link';

import {
  IconCamera,
  IconCard,
  IconChat,
  IconClipboard,
  IconLock,
  IconRoute,
  IconShield,
} from '@/components/icons';
import { CountUp } from '@/components/marketing/count-up';
import { IntroSplash } from '@/components/marketing/intro-splash';
import { ScrollReveal } from '@/components/marketing/scroll-reveal';
import { ButtonLink } from '@/components/ui/button';
import { SERVICES } from '@/lib/services';

const TRUST_STEPS = [
  {
    title: 'Background check',
    body: 'A third-party criminal and identity check clears before anything else.',
  },
  {
    title: 'Interview',
    body: 'A real conversation with our team about experience and judgment.',
  },
  {
    title: 'Home verification',
    body: 'We visit and review the home for pets who will stay overnight.',
  },
  {
    title: 'Insured',
    body: 'Active coverage on file, tracked and re-checked before it expires.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell us about your pet',
    body: 'Breed, size, energy, medications, what scares them, what calms them. The more we know, the better the match.',
  },
  {
    step: '02',
    title: 'See only Haveners who fit',
    body: 'We hide anyone who does not accept your pet’s requirements — even if they are nearby and highly rated. Compatibility comes before popularity.',
  },
  {
    step: '03',
    title: 'Message, book and pay in one place',
    body: 'Agree the details in Havenr chat, send the request, and pay through the platform. Your Havener is paid after the service is complete.',
  },
  {
    step: '04',
    title: 'Follow along, then get the report',
    body: 'Photos, videos, GPS routes and activity logs as they happen — and a full summary when the service ends.',
  },
];

const FEATURES = [
  {
    icon: IconCamera,
    title: 'Updates you don’t have to ask for',
    body: 'Boarding and daycare Haveners are reminded to send photos and videos during the day. If nothing has arrived, we remind them again.',
    swatch: 'bg-cream',
  },
  {
    icon: IconRoute,
    title: 'Walks you can actually verify',
    body: 'GPS route, distance, duration, potty log and required photos. A walk cannot be marked complete until the report is filled in.',
    swatch: 'bg-sky-100',
  },
  {
    icon: IconClipboard,
    title: 'Visits with a real checklist',
    body: 'Litter, food, water, play, medication, wellbeing check. Every task is ticked off and timestamped.',
    swatch: 'bg-gold-50',
  },
  {
    icon: IconChat,
    title: 'Everything stays in the app',
    body: 'Messages, agreements and evidence live in one thread, so support can see exactly what was promised if anything goes wrong.',
    swatch: 'bg-white',
  },
  {
    icon: IconCard,
    title: 'One clear total, no surprises',
    body: 'Service rate, add-ons, taxes and tip are itemized before you confirm. Any charge added later needs your approval first.',
    swatch: 'bg-sky-200',
  },
  {
    icon: IconLock,
    title: 'Private by design',
    body: 'Your address is hidden until a booking is confirmed. We never send your location, bookings or conversations to advertising platforms.',
    swatch: 'bg-cream',
  },
];

const MARQUEE_ITEMS = [
  'Background checked',
  'Interviewed',
  'Home verified',
  'Insured',
  'GPS-tracked walks',
  'Photo updates every visit',
];

export default function HomePage() {
  return (
    <>
      <IntroSplash />
      <ScrollReveal />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-sky-200">
        <div
          className="animate-blob-move absolute -left-16 -top-16 h-64 w-64 bg-gold-200/60"
          style={{
            borderRadius: '44% 56% 62% 38% / 48% 42% 58% 52%',
          }}
        />
        <div
          className="animate-blob-move absolute right-[-4%] top-[10%] h-52 w-52 bg-cream/75"
          style={{
            borderRadius: '44% 56% 62% 38% / 48% 42% 58% 52%',
            animationDelay: '-4s',
          }}
        />

        <div className="container-page relative z-[2] pb-10 pt-14 sm:pt-16">
          <span className="animate-bob inline-flex -rotate-2 items-center gap-2 border-2 border-espresso-700 bg-espresso-700 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-cream">
            <IconShield width={14} height={14} />
            Background checked · Interviewed · Home verified · Insured
          </span>

          <h1 className="mt-6 font-display font-black uppercase leading-[0.86] tracking-tight">
            <span className="block text-[2.6rem] text-espresso-700 sm:text-6xl lg:text-7xl">
              Pet care you can
            </span>
            <span className="block text-[3.4rem] text-gold-700 sm:text-[5.5rem] lg:text-[7.5rem]">
              Actually trust.
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-lg font-semibold leading-relaxed text-espresso-600/80">
            Boarding, daycare, house sitting, walks and drop-in visits with
            Haveners who earned their place. Every stay comes with photos,
            updates and a report — not a shrug.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink
              href="/signup"
              size="lg"
              className="animate-pulse-btn !rounded-none border-2 border-espresso-700 shadow-poster"
            >
              Find a Havener
            </ButtonLink>
            <ButtonLink
              href="/become-a-havener"
              variant="secondary"
              size="lg"
              className="!rounded-none border-espresso-700 shadow-poster"
            >
              Become a Havener
            </ButtonLink>
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
                <dd className="mt-1 max-w-[10rem] text-xs font-bold uppercase tracking-wide text-espresso-600/70">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative z-[3] overflow-hidden border-y-[3px] border-espresso-700 bg-espresso-700 py-3.5">
          <div className="animate-marquee flex w-max">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-3 whitespace-nowrap px-6 font-display text-lg font-bold uppercase tracking-wide text-cream after:content-['✦'] after:text-gold-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-[100px] overflow-hidden bg-sky-200" aria-hidden>
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute bottom-[-1px] left-0 h-full w-full"
        >
          <path
            d="M0,0 L1440,0 L1440,50 C1200,100 1000,15 760,46 C520,75 320,8 0,58 Z"
            className="fill-bone"
          />
        </svg>
      </div>

      {/* ------------------------------------------------------------ Services */}
      <section className="bg-bone py-20 sm:py-24">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-600 after:ml-2 after:content-['•']">
            What we offer
          </span>
          <h2 className="mt-3 max-w-md font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-5xl">
            Five ways to get your pet cared for
          </h2>
        </div>

        <div className="container-page mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              data-reveal
              style={{ transitionDelay: `${(i + 1) * 90}ms` }}
              className="group flex flex-col border-[3px] border-espresso-700 bg-white p-7 text-espresso-700 shadow-poster transition-transform hover:translate-x-[3px] hover:translate-y-[3px]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-2xl font-black uppercase">
                  {service.name}
                </h3>
                <span className="shrink-0 border-2 border-espresso-700 bg-cream px-2.5 py-1 font-display text-xs font-bold text-olive-600">
                  from ${service.fromRate}/{service.rateUnit}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-gold-700">
                {service.tagline}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-espresso-600">
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

          <div
            data-reveal
            style={{ transitionDelay: `${(SERVICES.length + 1) * 90}ms` }}
            className="flex flex-col justify-center border-[3px] border-espresso-700 bg-espresso-700 p-7 text-cream shadow-poster"
          >
            <h3 className="font-display text-2xl font-black uppercase text-cream">
              Not sure which one?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              Tell us about your pet and your dates. We’ll only show you
              Haveners who can genuinely take them.
            </p>
            <ButtonLink
              href="/signup"
              size="sm"
              className="!rounded-none mt-6 self-start border-2 border-cream !shadow-none"
            >
              Get matched
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- Trust */}
      <section className="bg-espresso-700 py-20 text-cream sm:py-24">
        <div className="container-page grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal>
            <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-400 after:ml-2 after:content-['•']">
              Trust &amp; safety
            </span>
            <h2 className="mt-3 max-w-xs font-display text-4xl font-black uppercase leading-[0.94] text-cream sm:text-5xl">
              Four checks. No exceptions.
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-cream/70">
              Being nearby and cheap is not enough to care for someone’s dog.
              A Havener clears all four steps before a single booking reaches
              them.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST_STEPS.map((item, index) => (
              <div
                key={item.title}
                data-reveal
                style={{ transitionDelay: `${(index + 1) * 90}ms` }}
                className="border-2 border-cream/25 p-6 transition-transform hover:-translate-y-1.5"
              >
                <span className="font-display text-2xl font-black text-gold-400">
                  0{index + 1}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold uppercase text-cream">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          data-reveal
          className="container-page mt-12 flex flex-wrap items-center gap-4 border-2 border-cream/25 p-6"
        >
          <IconShield className="shrink-0 text-gold-400" width={24} height={24} />
          <p className="flex-1 text-sm leading-relaxed text-cream/70">
            A Havener who clears all four becomes a{' '}
            <strong className="font-medium text-cream">Certified Havener</strong>
            . You’ll see the badge on their profile — and you’ll never see their
            insurance document, because that stays private.
          </p>
          <Link
            href="/trust-and-safety"
            className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap border-2 border-cream bg-cream/[0.06] px-4 text-sm font-medium text-cream transition-colors hover:bg-cream/10"
          >
            How it works
          </Link>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section className="bg-bone py-20 sm:py-24">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-600 after:ml-2 after:content-['•']">
            How it works
          </span>
          <h2 className="mt-3 max-w-md font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-5xl">
            From “who can watch my dog?” to booked
          </h2>
        </div>

        <ol className="container-page mt-12 grid gap-9 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => (
            <li
              key={item.step}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 90}ms` }}
              className="relative"
            >
              <span className="font-display text-5xl font-black text-sky-300">
                {item.step}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold uppercase text-espresso-700">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section className="bg-white py-20 sm:py-24">
        <div className="container-page" data-reveal>
          <span className="font-display text-sm font-bold uppercase tracking-widest text-gold-600 after:ml-2 after:content-['•']">
            Built in
          </span>
          <h2 className="mt-3 max-w-md font-display text-4xl font-black uppercase leading-[0.94] text-espresso-700 sm:text-5xl">
            The details that decide whether you sleep well
          </h2>
        </div>

        <div className="container-page mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              data-reveal
              style={{ transitionDelay: `${(index + 1) * 90}ms` }}
              className={`border-[3px] border-espresso-700 p-7 shadow-poster ${feature.swatch}`}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center border-2 border-espresso-700 bg-white text-espresso-700">
                <feature.icon />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold uppercase text-espresso-700">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-600">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="bg-gold-500 py-20 text-center sm:py-24" data-reveal>
        <div className="container-page">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-black uppercase leading-[0.92] text-white sm:text-5xl">
            Your pet already trusts you. Let’s find someone they can trust
            too.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] font-semibold leading-relaxed text-white/85">
            Creating an account is free. You only pay when you confirm a
            booking.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <ButtonLink
              href="/signup"
              variant="dark"
              size="lg"
              className="!rounded-none border-2 border-espresso-700"
            >
              Create your account
            </ButtonLink>
            <Link
              href="/how-it-works"
              className="inline-flex h-12 shrink-0 items-center justify-center whitespace-nowrap border-2 border-white bg-white px-7 text-base font-medium text-gold-600 transition-colors hover:bg-cream"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
