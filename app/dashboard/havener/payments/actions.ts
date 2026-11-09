'use server';

import { redirect } from 'next/navigation';
import type Stripe from 'stripe';

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

  const base = siteUrl();

  if (!accountId) {
    // A Havener is a person, not a business: everything Stripe would otherwise
    // ask about "the business" (industry, website, what they sell, how charges
    // read on a statement) is sent already filled in, so all that is left for
    // them is who they are and where to be paid.
    const prefilled: Stripe.AccountCreateParams = {
      type: 'express',
      email: profile.email ?? undefined,
      business_type: 'individual',
      individual: {
        first_name: profile.first_name ?? undefined,
        last_name: profile.last_name ?? undefined,
        email: profile.email ?? undefined,
      },
      business_profile: {
        // 7299 = miscellaneous personal services.
        mcc: '7299',
        url: `${base}/sitters/${profile.id}`,
        product_description:
          'Pet care (boarding, house sitting, daycare, walks and drop-in visits) booked through Havenr.',
      },
      settings: { payments: { statement_descriptor: 'HAVENR' } },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    };

    let account: Stripe.Account;
    try {
      account = await stripe.accounts.create(prefilled);
    } catch {
      // If Stripe rejects one of the prefilled details, fall back to the bare
      // account rather than leave the Havener unable to connect.
      try {
        account = await stripe.accounts.create({
          type: 'express',
          email: profile.email ?? undefined,
          business_type: 'individual',
          capabilities: prefilled.capabilities,
        });
      } catch (error) {
        return { error: stripeMessage(error) };
      }
    }
    accountId = account.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('sitter_profiles') as any)
      .update({ stripe_account_id: accountId })
      .eq('id', profile.id);
    if (error) return { error: error.message };
  } else {
    // An account created before the business details were sent already filled
    // in: send them now, so Stripe stops asking the Havener about a "business".
    // Whatever Stripe won't change any more is simply left as it is.
    try {
      await stripe.accounts.update(accountId, {
        business_profile: {
          mcc: '7299',
          url: `${base}/sitters/${profile.id}`,
          product_description:
            'Pet care (boarding, house sitting, daycare, walks and drop-in visits) booked through Havenr.',
        },
      });
    } catch {
      /* already provided or locked by Stripe — nothing to do */
    }
    try {
      await stripe.accounts.update(accountId, {
        settings: { payments: { statement_descriptor: 'HAVENR' } },
      });
    } catch {
      /* same */
    }
  }

  let url: string;
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/dashboard/havener/payments`,
      return_url: `${base}/dashboard/havener/payments`,
      type: 'account_onboarding',
    });
    url = link.url;
  } catch (error) {
    return { error: stripeMessage(error) };
  }

  redirect(url);
}

/** Stripe's own explanation, shown instead of crashing the page. */
function stripeMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? `Stripe couldn’t start the setup: ${error.message}`
    : 'Stripe couldn’t start the setup. Please try again in a moment.';
}
