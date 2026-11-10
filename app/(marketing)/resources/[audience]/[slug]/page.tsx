import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AUDIENCE_LABEL, findResource, RESOURCES } from '@/lib/resources';

export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ audience: resource.audience, slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ audience: string; slug: string }>;
}): Promise<Metadata> {
  const { audience, slug } = await params;
  const resource = findResource(audience, slug);
  return { title: resource?.title ?? 'Resources', description: resource?.summary };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ audience: string; slug: string }>;
}) {
  const { audience, slug } = await params;
  const resource = findResource(audience, slug);
  if (!resource) notFound();

  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <Link href="/resources" className="text-sm text-espresso-500 hover:text-espresso-700">
        ← All resources
      </Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-olive-500">
        {AUDIENCE_LABEL[resource.audience]}
      </p>
      <h1 className="mt-2 text-[clamp(32px,3.2vw,44px)] leading-[1.05]">{resource.title}</h1>
      <p className="mt-3 text-[19px] text-espresso-500">{resource.summary}</p>

      <div className="mt-8 space-y-8">
        {resource.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-2xl">{section.heading}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-espresso-700">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
