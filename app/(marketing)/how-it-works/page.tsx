import type { Metadata } from 'next';

import { IconCheck } from '@/components/icons';
import { Section, SectionHeading } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How a Havenr booking works, from your pet’s profile to the final report and payment.',
};

const OWNER_STEPS = [
  {
    title: 'Create your pet’s profile',
    body: 'Health, feeding, behavior, what they’re good with and what they’re not. Vaccination records are required before a booking — it protects your pet and everyone else’s.',
  },
  {
    title: 'Search by what actually matters',
    body: 'Service, dates, location and your pet. A Havener who does not accept one of your pet’s requirements will not appear, no matter how well reviewed or how close they are.',
  },
  {
    title: 'Review the profile properly',
    body: 'Rates, availability, house details, distance from you, badges, reviews and how recently they updated their calendar. Insurance shows as a badge — never as a document.',
  },
  {
    title: 'Message before you commit',
    body: 'Ask about the routine, the yard, the other pets. Keep it in Havenr chat so support has the full picture if anything is ever disputed.',
  },
  {
    title: 'Send the request and pay',
    body: 'Your Havener accepts, declines or replies. Payment goes to Havenr, not directly to them — that is what lets us protect both sides.',
  },
  {
    title: 'Follow along and get the report',
    body: 'Photos, videos, GPS and activity logs as they happen. When it ends you get a summary, a highlight reel for boarding and daycare, and the option to review and tip.',
  },
];

const SITTER_STEPS = [
  {
    title: 'Apply and get verified',
    body: 'Government ID with a live selfie check, a verified phone number, a background check, an interview, a home visit and proof of insurance.',
  },
  {
    title: 'Build your profile',
    body: 'Your services, your rates, your radius, the sizes and energy levels you take, whether you have a yard, kids or pets of your own, and what a day of care looks like with you.',
  },
  {
    title: 'Control your calendar',
    body: 'Block days, go off the grid for a weekend, and update availability with one tap — owners can see how recently you did it.',
  },
  {
    title: 'Deliver and document',
    body: 'Start and end services in the app. Photos and required fields are not optional: a walk or a visit cannot be closed without them.',
  },
  {
    title: 'Get paid and grow',
    body: 'Havenr collects from the owner, takes its service fee and pays you after the service is complete. Your stats, earnings and tax documents live in your dashboard.',
  },
];

function StepList({
  steps,
}: {
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <ol className="mt-10 space-y-4">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-5 rounded-2xl border border-espresso-700/8 bg-white p-6 shadow-card"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream font-display text-sm text-olive-600">
            {index + 1}
          </span>
          <div>
            <h3 className="text-lg text-espresso-700">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-espresso-500">
              {step.body}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <Section tone="cream" className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="No mystery, no guesswork"
          description="Here is exactly what happens on both sides of a Havenr booking."
        />
      </Section>

      <Section tone="bone">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow">For pet owners</p>
            <h2 className="mt-3 text-3xl">Booking care</h2>
            <StepList steps={OWNER_STEPS} />
          </div>
          <div>
            <p className="eyebrow">For Haveners</p>
            <h2 className="mt-3 text-3xl">Giving care</h2>
            <StepList steps={SITTER_STEPS} />
          </div>
        </div>
      </Section>

      <Section tone="espresso">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeading
            align="left"
            tone="light"
            eyebrow="Payments"
            title="One total, itemized, before you confirm"
          />
          <div>
            <ul className="space-y-3.5">
              {[
                'The Havener’s rate for the service',
                'Havenr’s platform fee',
                'Add-ons you approved — extra pet, puppy, holiday, transport, late pick-up, medication, vet trip',
                'Taxes where they apply',
                'An optional tip, kept separate from everything else',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <IconCheck
                    width={20}
                    height={20}
                    className="mt-0.5 shrink-0 text-gold-400"
                  />
                  <span className="text-[15px] leading-relaxed text-cream/75">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-7 rounded-2xl border border-cream/12 bg-cream/[0.04] p-5 text-sm leading-relaxed text-cream/65">
              Any charge that comes up after the booking starts has to be
              explained and approved by you before it is processed. Nothing gets
              added quietly.
            </p>
          </div>
        </div>
      </Section>

      <section className="bg-white">
        <div className="container-page py-20 text-center">
          <h2 className="text-3xl">Ready when you are</h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-espresso-500">
            Set up your pet’s profile in a few minutes. You only pay when you
            confirm a booking.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup" size="lg">
              Create your account
            </ButtonLink>
            <ButtonLink href="/services" variant="secondary" size="lg">
              Browse services
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
