import type { Metadata } from 'next';

import { IconCard, IconChart, IconCheck, IconClipboard } from '@/components/icons';
import { Section, SectionHeading } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';
import { SERVICES } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Become a Havener',
  description:
    'Earn money caring for pets on your terms. Set your own rates, calendar and rules — we handle payments, vetting and support.',
};

const REQUIREMENTS = [
  'You’re 18 or older and legally able to work in the United States',
  'A Social Security number or ITIN for the background check',
  'Government-issued photo ID that matches your payout method',
  'A verified phone number and a smartphone that can take photos',
  'Liability insurance that meets our requirements (we’ll walk you through it)',
  'Willingness to be interviewed and, for boarding or daycare, to have your home reviewed',
];

const PERKS = [
  {
    icon: IconCard,
    title: 'You set your rates',
    body: 'Per service, plus your own charges for extra pets, puppies, holidays, transport and late pick-ups.',
  },
  {
    icon: IconClipboard,
    title: 'You set your rules',
    body: 'Species, sizes, energy levels, whether you take unfixed dogs, how many pets a day, and how far you travel.',
  },
  {
    icon: IconChart,
    title: 'You see your numbers',
    body: 'Profile views, search appearances, request conversion, repeat clients, earnings and tips — by week, month or year.',
  },
];

export default function BecomeAHavenerPage() {
  return (
    <>
      <section className="bg-espresso-700">
        <div className="container-page py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow text-cream/55">Become a Havener</p>
            <h1 className="mt-4 text-4xl font-light leading-[1.1] text-cream sm:text-5xl">
              Get paid to do what you’d probably do anyway.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-cream/70">
              Set your own rates, your own calendar and your own rules. We
              bring you the bookings, handle the payments, and make sure the
              pets who arrive are ones you actually said yes to.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/signup?role=havener" size="lg">
                Start your application
              </ButtonLink>
              <ButtonLink href="#requirements" variant="secondary" size="lg">
                See the requirements
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <Section tone="bone">
        <SectionHeading
          eyebrow="Why Havenr"
          title="Built around the person doing the work"
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cream text-olive-600">
                <perk.icon />
              </span>
              <h3 className="mt-5 text-lg text-espresso-700">{perk.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                {perk.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-sky-100 p-8">
          <h3 className="text-xl text-espresso-700">
            Choose any combination of services
          </h3>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {SERVICES.map((service) => (
              <span
                key={service.slug}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-espresso-700"
              >
                {service.name}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-espresso-600">
            Dogs, cats, or both — and you decide that per service. Plenty of
            Haveners board dogs but only do drop-in visits for cats.
          </p>
        </div>
      </Section>

      <Section tone="white" className="scroll-mt-20">
        <div id="requirements" className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeading
            align="left"
            eyebrow="Requirements"
            title="What you’ll need"
            description="Every Havener clears the same bar. It takes longer than signing up elsewhere — that is the point."
          />

          <div>
            <ul className="space-y-3.5">
              {REQUIREMENTS.map((item) => (
                <li key={item} className="flex gap-3">
                  <IconCheck
                    width={20}
                    height={20}
                    className="mt-0.5 shrink-0 text-gold-500"
                  />
                  <span className="text-[15px] leading-relaxed text-espresso-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-sky-200 bg-sky-50 p-6">
              <p className="text-sm leading-relaxed text-sky-900">
                <strong className="font-medium">Being approved is not automatic and it is not permanent.</strong>{' '}
                Approval depends on your background check, interview, home
                review and insurance staying current. If your coverage lapses or
                a serious incident is confirmed, your listing comes down.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <section className="bg-cream">
        <div className="container-page py-20 text-center">
          <h2 className="text-3xl">Start your application</h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-espresso-600/80">
            Create your account, build your profile, and submit for review. You
            can save and come back at any point.
          </p>
          <ButtonLink href="/signup?role=havener" size="lg" className="mt-8">
            Apply to be a Havener
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
