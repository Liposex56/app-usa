import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { IconCheck } from '@/components/icons';
import { Section } from '@/components/marketing/section';
import { ButtonLink } from '@/components/ui/button';
import { SERVICES, serviceBySlug } from '@/lib/services';

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return { title: 'Service not found' };
  return { title: service.name, description: service.description };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <>
      <section className="bg-sky-200">
        <div className="container-page py-16 sm:py-20">
          <Link
            href="/services"
            className="text-sm text-espresso-600/70 transition-colors hover:text-espresso-700"
          >
            ← All services
          </Link>
          <h1 className="mt-5 max-w-3xl text-4xl font-light leading-[1.1] text-espresso-700 sm:text-5xl">
            {service.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-espresso-600/80">
            {service.tagline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/signup" size="lg">
              Find a Havener
            </ButtonLink>
            <span className="inline-flex items-center rounded-full bg-espresso-700/8 px-4 text-sm font-medium text-espresso-700">
              from ${service.fromRate} per {service.rateUnit}
            </span>
          </div>
        </div>
      </section>

      <Section tone="bone">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 className="text-2xl">What this is</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-espresso-500">
              {service.description}
            </p>

            <h2 className="mt-12 text-2xl">What’s always included</h2>
            <ul className="mt-5 space-y-3.5">
              {service.includes.map((item) => (
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

            <div className="mt-12 rounded-2xl border border-sky-200 bg-sky-50 p-7">
              <h3 className="text-lg text-espresso-700">
                Cancellations and changes
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-espresso-600">
                Once a booking is confirmed, changes need your Havener’s
                approval, and cancellations follow the policy shown on their
                profile before you book. We always ask why — and support is
                notified either way, so a bad situation gets a human, not a
                form.
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-olive-500">
                At a glance
              </h3>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-espresso-500/60">Where it happens</dt>
                  <dd className="mt-0.5 text-espresso-700">{service.where}</dd>
                </div>
                <div>
                  <dt className="text-espresso-500/60">How long</dt>
                  <dd className="mt-0.5 text-espresso-700">{service.duration}</dd>
                </div>
                <div>
                  <dt className="text-espresso-500/60">Pets accepted</dt>
                  <dd className="mt-0.5 text-espresso-700">
                    {service.species
                      .map((s) => (s === 'dog' ? 'Dogs' : 'Cats'))
                      .join(' and ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-espresso-500/60">Starting at</dt>
                  <dd className="mt-0.5 text-espresso-700">
                    ${service.fromRate} per {service.rateUnit}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl bg-espresso-700 p-7 text-cream">
              <h3 className="text-lg text-cream">Other services</h3>
              <ul className="mt-4 space-y-2.5">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/services/${other.slug}`}
                      className="text-sm text-cream/75 transition-colors hover:text-cream"
                    >
                      {other.name} — {other.tagline}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
