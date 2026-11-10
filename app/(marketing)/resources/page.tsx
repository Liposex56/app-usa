import type { Metadata } from 'next';
import Link from 'next/link';

import { AUDIENCE_LABEL, resourcesFor, type ResourceAudience } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Guides for Haveners and for pet parents: booking, meet & greets, stays, walks and holidays.',
};

const AUDIENCES: ResourceAudience[] = ['haveners', 'owners'];

export default function ResourcesPage() {
  return (
    <div className="container-page max-w-5xl py-12 sm:py-16">
      <h1 className="text-[clamp(34px,3.4vw,46px)] leading-none">Resources</h1>
      <p className="mt-3 max-w-2xl text-[17px] text-espresso-500">
        Short guides for every step — one set for Haveners, one for pet parents.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {AUDIENCES.map((audience) => (
          <section key={audience} id={audience}>
            <h2 className="text-2xl">{AUDIENCE_LABEL[audience]}</h2>
            <ul className="mt-4 space-y-3">
              {resourcesFor(audience).map((resource) => (
                <li key={resource.slug}>
                  <Link
                    href={`/resources/${audience}/${resource.slug}`}
                    className="block rounded-2xl border border-espresso-700/10 bg-hv-paper p-5 shadow-card hover:border-espresso-700/30"
                  >
                    <span className="block text-[19px] font-semibold text-espresso-700">
                      {resource.title}
                    </span>
                    <span className="mt-1 block text-[16px] text-espresso-500">
                      {resource.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
