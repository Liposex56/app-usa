import Image from 'next/image';
import Link from 'next/link';

import {
  IconCamera,
  IconCard,
  IconChat,
  IconCheck,
  IconClipboard,
  IconLock,
  IconRoute,
  IconShield,
} from '@/components/icons';
import { Section, SectionHeading } from '@/components/marketing/section';
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
  },
  {
    icon: IconRoute,
    title: 'Walks you can actually verify',
    body: 'GPS route, distance, duration, potty log and required photos. A walk cannot be marked complete until the report is filled in.',
  },
  {
    icon: IconClipboard,
    title: 'Visits with a real checklist',
    body: 'Litter, food, water, play, medication, wellbeing check. Every task is ticked off and timestamped.',
  },
  {
    icon: IconChat,
    title: 'Everything stays in the app',
    body: 'Messages, agreements and evidence live in one thread, so support can see exactly what was promised if anything goes wrong.',
  },
  {
    icon: IconCard,
    title: 'One clear total, no surprises',
    body: 'Service rate, add-ons, taxes and tip are itemized before you confirm. Any charge added later needs your approval first.',
  },
  {
    icon: IconLock,
    title: 'Private by design',
    body: 'Your address is hidden until a booking is confirmed. We never send your location, bookings or conversations to advertising platforms.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-sky-200">
        <div className="container-page grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-espresso-700/8 px-3.5 py-1.5 text-xs font-medium text-espresso-700">
              <IconShield width={14} height={14} />
              Background checked · Interviewed · Home verified · Insured
            </p>

            <h1 className="mt-6 text-[2.6rem] font-light leading-[1.08] text-espresso-700 sm:text-6xl">
              Pet care you can
              <br />
              actually trust.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-espresso-600/80">
              Boarding, daycare, house sitting, walks and drop-in visits with
              Haveners who earned their place. Every stay comes with photos,
              updates and a report — not a shrug.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg">
                Find a Havener
              </ButtonLink>
              <ButtonLink href="/become-a-havener" variant="secondary" size="lg">
                Become a Havener
              </ButtonLink>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-espresso-700/10 pt-7">
              {[
                ['4 checks', 'before a Havener can take a booking'],
                ['5 services', 'from a 20-minute visit to a two-week stay'],
                ['0 data sold', 'to advertisers, ever'],
              ].map(([value, label]) => (
                <div key={value}>
                  <dt className="font-display text-xl text-espresso-700">
                    {value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-espresso-600/70">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[3rem] bg-cream/45 blur-2xl" />
            <div className="relative rounded-4xl bg-bone p-10 shadow-lift">
              <Image
                src="/brand/mark-dog.png"
                alt=""
                width={783}
                height={384}
                priority
                className="h-auto w-full"
              />
              <div className="mt-8 space-y-3">
                {TRUST_STEPS.map((item) => (
                  <div key={item.title} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white">
                      <IconCheck width={15} height={15} />
                    </span>
                    <span className="text-sm font-medium text-espresso-700">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Services */}
      <Section tone="bone">
        <SectionHeading
          eyebrow="What we offer"
          title="Five ways to get your pet cared for"
          description="Every service has its own evidence requirements, so you always know what happened while you were away."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group flex flex-col rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card transition-all hover:-translate-y-0.5 hover:border-gold-500/40 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl text-espresso-700">{service.name}</h3>
                <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-olive-600">
                  from ${service.fromRate}/{service.rateUnit}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-gold-600">
                {service.tagline}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-espresso-500">
                {service.description}
              </p>
              <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-espresso-700 transition-colors group-hover:text-gold-600">
                Learn more
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </p>
            </Link>
          ))}

          <div className="flex flex-col justify-center rounded-3xl bg-espresso-700 p-7 text-cream">
            <h3 className="text-xl text-cream">Not sure which one?</h3>
            <p className="mt-3 text-sm leading-relaxed text-cream/70">
              Tell us about your pet and your dates. We’ll only show you
              Haveners who can genuinely take them.
            </p>
            <ButtonLink href="/signup" size="sm" className="mt-6 self-start">
              Get matched
            </ButtonLink>
          </div>
        </div>
      </Section>

      {/* --------------------------------------------------------------- Trust */}
      <Section tone="espresso">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            align="left"
            tone="light"
            eyebrow="Trust & safety"
            title="Four checks. No exceptions."
            description="Being nearby and cheap is not enough to care for someone’s dog. A Havener clears all four steps before a single booking reaches them."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {TRUST_STEPS.map((item, index) => (
              <div
                key={item.title}
                className="rounded-2xl border border-cream/12 bg-cream/[0.04] p-6"
              >
                <span className="font-display text-sm text-gold-400">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-lg text-cream">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 rounded-2xl border border-cream/12 bg-cream/[0.04] p-6">
          <IconShield className="shrink-0 text-gold-400" width={24} height={24} />
          <p className="flex-1 text-sm leading-relaxed text-cream/70">
            A Havener who clears all four becomes a{' '}
            <strong className="font-medium text-cream">Certified Havener</strong>
            . You’ll see the badge on their profile — and you’ll never see their
            insurance document, because that stays private.
          </p>
          <ButtonLink href="/trust-and-safety" variant="secondary" size="sm">
            How it works
          </ButtonLink>
        </div>
      </Section>

      {/* -------------------------------------------------------- How it works */}
      <Section tone="white">
        <SectionHeading
          eyebrow="How it works"
          title="From “who can watch my dog?” to booked"
          description="Four steps, and you can stop at any point without paying anything."
        />

        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="relative">
              <span className="font-display text-4xl font-light text-sky-300">
                {item.step}
              </span>
              <h3 className="mt-3 text-lg text-espresso-700">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ------------------------------------------------------------ Features */}
      <Section tone="bone">
        <SectionHeading
          eyebrow="Built in"
          title="The details that decide whether you sleep well"
          description="These are not add-ons. They are how every Havenr booking works."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <feature.icon />
              </span>
              <h3 className="mt-5 text-lg text-espresso-700">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="bg-cream">
        <div className="container-page py-20 text-center sm:py-24">
          <h2 className="mx-auto max-w-2xl text-3xl leading-[1.15] sm:text-4xl">
            Your pet already trusts you. Let’s find someone they can trust too.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-espresso-600/75">
            Creating an account is free. You only pay when you confirm a
            booking.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
