'use server';

import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { getStripe, siteUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export type VerifyActionState = { error: string | null };

/**
 * Automated document review (§12's "background check"): Stripe Identity
 * checks a government ID against a live selfie. It's a real identity check,
 * not a full criminal-history background check — the badge/status name is
 * kept as `background_check_status` because that's what the rest of the
 * app (and the public "Background checked" badge) already reads, but treat
 * this as verified identity, and swap in a dedicated background-check
 * vendor later if the business needs more than that.
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
      background_check_status: 'pending',
    })
    .eq('id', profile.id);
  if (error) return { error: error.message };

  if (!session.url) return { error: 'Could not start verification.' };
  redirect(session.url);
}
