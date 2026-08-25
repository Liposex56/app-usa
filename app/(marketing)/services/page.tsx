import type { Metadata } from 'next';
import Link from 'next/link';

import { IconCheck } from '@/components/icons';
import { Section, SectionHeading } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';
import { SERVICES } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Boarding, daycare, house sitting, dog walking and drop-in visits — with the evidence requirements that come with each one.',
};

export default function ServicesPage() {
  return (
    <>
      <Section tone="cream" className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Services"
          title="Five services, one standard of care"
          description="Whether it’s a twenty-minute visit or a two-week stay, you get the same thing: a verified Havener, evidence while it happens, and a report at the end."
        />
      </Section>

      <Section tone="bone">
        <div className="space-y-6">
          {SERVICES.map((service) => (
            <article
              key={service.slug}
              className="grid gap-8 rounded-3xl border border-espresso-700/8 bg-white p-8 shadow-card lg:grid-cols-[1fr_1.1fr] lg:p-10"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl text-espresso-700">{service.name}</h2>
                  <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-olive-600">
                    from ${service.fromRate}/{service.rateUnit}
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-medium text-gold-600">
                  {service.tagline}
                </p>
                <p className="mt-5 text-[15px] leading-relaxed text-espresso-500">
                  {service.description}
                </p>

                <dl className="mt-7 grid grid-cols-2 gap-5 border-t border-espresso-700/8 pt-6 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                      Where
                    </dt>
                    <dd className="mt-1 text-espresso-700">{service.where}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                      How long
                    </dt>
                    <dd className="mt-1 text-espresso-700">{service.duration}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs uppercase tracking-wider text-espresso-500/60">
                      For
                    </dt>
                    <dd className="mt-1 text-espresso-700">
                      {service.species
                        .map((s) => (s === 'dog' ? 'Dogs' : 'Cats'))
                        .join(' and ')}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/signup" size="sm">
                    Book {service.name.toLowerCase()}
                  </ButtonLink>
                  <ButtonLink
                    href={`/services/${service.slug}`}
                    variant="secondary"
                    size="sm"
                  >
                    Details
                  </ButtonLink>
                </div>
              </div>

              <div className="rounded-2xl bg-bone p-7">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive-500">
                  What’s always included
                </h3>
                <ul className="mt-5 space-y-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <IconCheck
                        width={18}
                        height={18}
                        className="mt-0.5 shrink-0 text-gold-500"
                      />
                      <span className="text-sm leading-relaxed text-espresso-600">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-espresso-500">
          Looking to offer these services instead?{' '}
          <Link
            href="/become-a-havener"
            className="font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
          >
            Become a Havener
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
