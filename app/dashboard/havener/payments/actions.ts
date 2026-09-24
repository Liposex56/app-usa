'use server';

import { redirect } from 'next/navigation';

import { requireProfile } from '@/lib/auth';
import { getStripe, siteUrl } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export type ConnectActionState = { error: string | null };

/**
 * Creates the Havener's Stripe Express account on first use, then always
 * returns a fresh onboarding/update Account Link — Stripe's links expire
 * quickly, so this can't be a one-time thing stored on the row.
 */
export async function connectStripeAction(): Promise<ConnectActionState> {
  const profile = await requireProfile();
  if (!profile.is_havener) return { error: 'Not a Havener account.' };

  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        'Payments aren’t turned on yet — Havenr hasn’t connected a Stripe account. Ask the team to finish that setup first.',
    };
  }

  const supabase = await createClient();
  const { data: sitter } = await supabase
    .from('sitter_profiles')
    .select('stripe_account_id')
    .eq('id', profile.id)
    .maybeSingle();

  let accountId = sitter?.stripe_account_id ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: profile.email ?? undefined,
      business_type: 'individual',
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    accountId = account.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sitter_profiles') as any)
      .update({ stripe_account_id: accountId })
      .eq('id', profile.id);
    if (error) return { error: error.message };
  }

  const base = siteUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/dashboard/havener/payments`,
    return_url: `${base}/dashboard/havener/payments`,
    type: 'account_onboarding',
  });

  redirect(link.url);
}
