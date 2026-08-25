import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Section } from '@/components/marketing/section';

/**
 * Placeholder shells for the legal pages. The actual terms, privacy policy and
 * cookie notice must be drafted by a US attorney — see the README. These exist
 * so the footer links resolve and so there is one obvious place to paste the
 * approved copy.
 */
const PAGES: Record<string, { title: string; intro: string }> = {
  terms: {
    title: 'Terms of Service',
    intro:
      'These terms govern the use of Havenr by pet owners and Haveners, including bookings, payments, cancellations and liability.',
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what personal data Havenr collects, how it is used, how long it is kept, and how you can access or delete it.',
  },
  cookies: {
    title: 'Cookie Preferences',
    intro:
      'Havenr uses only the cookies required to keep you signed in and to keep the service secure. No advertising or tracking cookie is set without your consent.',
  },
};

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? 'Legal' };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <Section tone="bone">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-light">{page.title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-espresso-500">
          {page.intro}
        </p>

        <div className="mt-10 rounded-2xl border border-sky-200 bg-sky-50 p-6">
          <p className="text-sm leading-relaxed text-sky-900">
            <strong className="font-medium">This document is not final.</strong>{' '}
            Havenr’s {page.title.toLowerCase()} is being prepared with counsel
            licensed in the United States. Once approved, the text replaces this
            placeholder.
          </p>
        </div>
      </div>
    </Section>
  );
}
