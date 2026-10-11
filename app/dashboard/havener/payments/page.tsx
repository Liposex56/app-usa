import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

import { ConnectButton } from './connect-button';

export const metadata: Metadata = { title: 'Payments and payouts — Havenr' };

export default async function HavenerPaymentsPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_profiles')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();
  let sitter = data as SitterProfileRow | null;

  const stripe = getStripe();
  const stripeConfigured = Boolean(stripe);

  // Opportunistic sync in case the account.updated webhook hasn't landed
  // yet (or webhooks aren't configured at all) — harmless no-op once
  // charges/payouts are already marked enabled.
  if (stripe && sitter?.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(sitter.stripe_account_id);
      if (
        account.charges_enabled !== sitter.stripe_charges_enabled ||
        account.payouts_enabled !== sitter.stripe_payouts_enabled
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('sitter_profiles') as any)
          .update({
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
          })
          .eq('id', profile.id);
        sitter = {
          ...sitter,
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
        };
      }
    } catch {
      // Account may have been deleted on Stripe's side or the key rotated —
      // not worth failing the page over, connectStripeAction will recreate it.
    }
  }

  const ready = Boolean(sitter?.stripe_charges_enabled && sitter?.stripe_payouts_enabled);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to my Havener profile
      </Link>

      <h1 className="mt-6 text-xl font-semibold text-espresso-700">
        Payments and payouts
      </h1>
      <p className="mt-2 text-sm text-espresso-500">
        Havenr pays each Havener through Stripe. Connect your account to
        receive your payouts directly in your bank when a service is
        completed.
      </p>

      <div className="mt-8 rounded-2xl border border-espresso-700/10 bg-hv-paper p-6">
        {!stripeConfigured ? (
          <div className="rounded-xl bg-cream p-4 text-sm text-olive-700">
            Payments aren’t turned on yet — Havenr still has to connect its
            Stripe account. Once it’s ready, come back here to connect your
            account and start getting paid.
          </div>
        ) : ready ? (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </span>
            <div>
              <p className="font-medium text-espresso-700">
                Your account is ready to get paid
              </p>
              <p className="text-sm text-espresso-500">
                Stripe will process your payouts automatically.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-espresso-600">
              {sitter?.stripe_account_id
                ? 'Your Stripe account is created but setup isn’t finished.'
                : 'You haven’t connected a Stripe account yet.'}
            </p>
            <div className="mt-4">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
