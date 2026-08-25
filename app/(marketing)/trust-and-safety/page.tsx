import type { Metadata } from 'next';

import { IconAlert, IconCheck, IconLock, IconShield } from '@/components/icons';
import { Section, SectionHeading } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Trust & safety',
  description:
    'How Havenr verifies Haveners, protects your data, and handles incidents.',
};

const CHECKS = [
  {
    title: 'Identity',
    body: 'Government-issued photo ID, matched against a live selfie. The name on the ID has to match the name on their payout method, and their phone number is verified by SMS.',
  },
  {
    title: 'Background check',
    body: 'Run through a specialized third-party provider. We store the status, date and reference of the check — never the full Social Security or ITIN number.',
  },
  {
    title: 'Interview',
    body: 'A conversation with our team about real experience: medications, anxious dogs, emergencies, and what they would do when something goes wrong.',
  },
  {
    title: 'Home verification',
    body: 'For anyone offering boarding or daycare, we review the home itself — space, fencing, other pets, stairs, and how many animals it can genuinely handle.',
  },
  {
    title: 'Insurance',
    body: 'Active coverage on file with the policy dates tracked. We remind them before it expires, and the badge comes off if it lapses.',
  },
];

const PRIVACY = [
  'Your street address stays hidden until a booking is confirmed and the Havener actually needs it.',
  'Haveners never see your full legal name, phone number, address or payment details.',
  'Your pet’s private notes are visible only to you, to the Havener with an active booking, and to authorized Havenr staff.',
  'Identity documents, vaccination records and insurance certificates live in private storage with signed, expiring links.',
  'Photos and videos from a booking are tied to that booking and visible only to the people on it.',
  'We do not send addresses, GPS locations, bookings, travel dates, payments, conversations or pet data to Google, Meta or any advertising platform.',
  'No tracking or advertising tool is installed without a review and explicit approval first.',
];

export default function TrustAndSafetyPage() {
  return (
    <>
      <Section tone="cream" className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Trust & safety"
          title="Earning the keys to your home"
          description="Leaving a pet with a stranger is a big ask. Here is everything we do before we ask it."
        />
      </Section>

      {/* Verification */}
      <Section tone="bone">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500 text-white">
              <IconShield width={24} height={24} />
            </span>
            <h2 className="mt-6 text-3xl">Five things we verify</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-espresso-500">
              A Havener who clears all of these carries the{' '}
              <strong className="font-medium text-espresso-700">
                Certified Havener
              </strong>{' '}
              badge. Anyone still in progress cannot receive bookings.
            </p>
          </div>

          <div className="space-y-4">
            {CHECKS.map((check) => (
              <div
                key={check.title}
                className="rounded-2xl border border-espresso-700/8 bg-white p-6 shadow-card"
              >
                <h3 className="flex items-center gap-2.5 text-lg text-espresso-700">
                  <IconCheck width={19} height={19} className="text-gold-500" />
                  {check.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-espresso-500">
                  {check.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Privacy */}
      <Section tone="espresso">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cream/10 text-gold-400">
              <IconLock width={24} height={24} />
            </span>
            <SectionHeading
              align="left"
              tone="light"
              title="Private by design"
              description="Pet care data is unusually sensitive: it says where you live, when you’re away, and who has your keys. We treat it that way."
            />
          </div>

          <ul className="space-y-3.5">
            {PRIVACY.map((item) => (
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
        </div>
      </Section>

      {/* Incidents + reviews */}
      <Section tone="white">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-espresso-700/8 bg-bone p-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <IconAlert />
            </span>
            <h3 className="mt-5 text-xl text-espresso-700">
              When something goes wrong
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-espresso-500">
              Bites, attempted bites, aggression, escapes, property damage and
              extreme anxiety are reported through a structured form with
              evidence. Sensitive answers stay private and go to our team, not
              onto a public profile — but they follow the record so the next
              booking is safer.
            </p>
          </div>

          <div className="rounded-3xl border border-espresso-700/8 bg-bone p-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cream text-olive-600">
              <IconShield />
            </span>
            <h3 className="mt-5 text-xl text-espresso-700">
              Reviews that mean something
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-espresso-500">
              Neither review is published until both sides have written theirs,
              or the window closes. That removes the incentive to write a
              retaliation review, and it means what you read is what someone
              actually thought — not what they negotiated.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-cream p-8 text-center">
          <h3 className="text-2xl">Questions about your data?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-espresso-600">
            You can request a copy of your data or ask us to delete it at any
            time. Our privacy policy explains what we keep, for how long, and
            why.
          </p>
          <ButtonLink href="/legal/privacy" variant="dark" size="sm" className="mt-6">
            Read the privacy policy
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
