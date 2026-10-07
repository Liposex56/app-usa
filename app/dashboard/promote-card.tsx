'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function PromoteCard({ code, link }: { code: string; link: string }) {
  const message =
    `Hi! I take care of pets on Havenr — every Havener is background checked, ` +
    `interviewed, home verified and insured. Sign up with my code ${code} and ` +
    `get $20 off your first booking: ${link}`;

  const [copied, setCopied] = useState<'message' | 'link' | null>(null);

  async function copy(kind: 'message' | 'link') {
    try {
      await navigator.clipboard.writeText(kind === 'message' ? message : link);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card">
      <h3 className="text-lg text-espresso-700">Promote your profile</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-espresso-500">
        Share your code — new owners get $20 off their first booking with you.
      </p>

      <p className="mt-4 inline-block rounded-full bg-cream px-4 py-1.5 font-mono text-sm font-semibold tracking-wider text-espresso-700">
        {code}
      </p>

      <p className="mt-4 rounded-xl bg-bone p-4 text-sm leading-relaxed text-espresso-600">
        {message}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => copy('message')}>
          {copied === 'message' ? 'Copied!' : 'Copy message'}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => copy('link')}>
          {copied === 'link' ? 'Copied!' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
}
