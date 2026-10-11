'use server';

import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { getStripe, siteUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export type VerifyActionState = { error: string | null };

/**
 * Identity verification: Stripe Identity checks a government ID against a
 * live selfie and reports back through the webhook, which sets
 * `identity_status`. This is *identity* only — the criminal-record check is a
 * separate step (background-actions.ts) and is what the public "Background
 * checked" badge reads.
 */
export async function createIdentitySessionAction(): Promise<VerifyActionState> {
  const profile = await requireProfile();
  if (!profile.is_havener) return { error: 'Not a Havener account.' };

  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        'Verification isn’t turned on yet — Havenr hasn’t connected a Stripe account.',
    };
  }

  const supabase = await createClient();
  const base = siteUrl();

  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: { sitter_id: profile.id },
    options: { document: { require_matching_selfie: true } },
    return_url: `${base}/dashboard/havener/verification`,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('sitter_profiles') as any)
    .update({
      stripe_identity_session_id: session.id,
      stripe_identity_status: 'processing',
    })
    .eq('id', profile.id);
  if (error) return { error: error.message };

  if (!session.url) return { error: 'Could not start verification.' };
  redirect(session.url);
}
