/**
 * Stripe Connect (payouts to Haveners) + Stripe Identity (automated
 * background-document verification). Both need a live Stripe account —
 * until STRIPE_SECRET_KEY is set in the environment, `getStripe()` returns
 * null and every caller shows a plain "payments aren't turned on yet"
 * message instead of a crash. Nothing here talks to Stripe until that key
 * exists; flip it on by setting the env var, no code changes needed.
 */

import Stripe from 'stripe';

let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  // Cast: pins the API version string without fighting the SDK's literal
  // union type if a patch bump ever shifts it slightly — Stripe accepts any
  // valid dated version string at runtime regardless of what this package's
  // types were generated against.
  cached = key
    ? new Stripe(key, {
        apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      })
    : null;
  return cached;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
