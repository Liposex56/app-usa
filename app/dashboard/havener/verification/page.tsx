import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import type { CheckStatus, SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import {
  checkrConfigured,
  effectiveBackgroundStatus,
  type BackgroundCheckStatus,
} from '@/lib/checkr';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

import { BackgroundCheckButton } from './background-button';
import { VerifyButton } from './verify-button';

export const metadata: Metadata = { title: 'Verification' };

type BackgroundRow = {
  status: BackgroundCheckStatus;
  invitation_url: string | null;
  note: string | null;
};

const IDENTITY_COPY: Record<CheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Not started', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending: { label: 'In progress', tone: 'bg-hv-butter text-olive-600' },
  approved: { label: 'Verified', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Needs another try', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired — try again', tone: 'bg-red-100 text-red-800' },
};

const BACKGROUND_COPY: Record<BackgroundCheckStatus, { label: string; tone: string }> = {
  not_started: { label: 'Not started', tone: 'bg-espresso-700/8 text-espresso-600' },
  invited: { label: 'Waiting for you', tone: 'bg-hv-butter text-olive-600' },
  processing: { label: 'In progress', tone: 'bg-hv-butter text-olive-600' },
  clear: { label: 'Passed', tone: 'bg-green-100 text-green-800' },
  // Deliberately neutral: a person on our team reviews it before any decision.
  consider: { label: 'Under review', tone: 'bg-hv-butter text-olive-600' },
  rejected: { label: 'Not approved', tone: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired — start again', tone: 'bg-red-100 text-red-800' },
};

function Step({
  number,
  title,
  status,
  children,
}: {
  number: number;
  title: string;
  status: { label: string; tone: string };
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-espresso-700/10 bg-hv-paper p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-hv-ink text-[17px] text-hv-cream">
            {number}
          </span>
          {title}
        </h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>
          {status.label}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-[17px] text-espresso-600">{children}</div>
    </section>
  );
}

export default async function HavenerVerificationPage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_profiles')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();
  const sitter = data as SitterProfileRow | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: backgroundRow } = await (supabase.from('background_checks') as any)
    .select('status, invitation_url, note')
    .eq('sitter_id', profile.id)
    .maybeSingle();
  const stored = backgroundRow as BackgroundRow | null;
  const background: BackgroundRow = {
    status: effectiveBackgroundStatus(stored, sitter?.background_check_status),
    invitation_url: stored?.invitation_url ?? null,
    note: stored?.note ?? null,
  };

  // `identity_status` is only written by the webhook; while a session is open
  // the Havener's own `stripe_identity_status` says it's in progress.
  const identityStatus: CheckStatus =
    sitter?.identity_status && sitter.identity_status !== 'not_started'
      ? sitter.identity_status
      : sitter?.stripe_identity_status === 'processing'
        ? 'pending'
        : 'not_started';
  const stripeConfigured = Boolean(getStripe());
  const checkrReady = checkrConfigured();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/havener"
        className="text-sm text-espresso-500 hover:text-espresso-700"
      >
        ← Back to my Havener profile
      </Link>

      <h1 className="mt-6 text-[clamp(34px,3.4vw,46px)] leading-none">Verification</h1>
      <p className="mt-3 text-[17px] text-espresso-500">
        Owners trust Haveners who are verified. There are two steps: confirming
        who you are, and a criminal background check. Together with your
        interview, home visit and insurance they earn the{' '}
        <strong className="text-espresso-700">Certified Havener</strong> badge.
      </p>

      <div className="mt-8 space-y-5">
        <Step number={1} title="Identity" status={IDENTITY_COPY[identityStatus]}>
          <p>
            We compare your government ID with a live selfie. It’s automatic and
            takes a couple of minutes.
          </p>
          {!stripeConfigured ? (
            <p className="rounded-2xl bg-hv-butter p-4 text-[16px] text-olive-700">
              Identity verification isn’t turned on yet — Havenr still has to
              connect its Stripe account. Once it’s ready, come back here.
            </p>
          ) : identityStatus === 'approved' ? (
            <p className="font-semibold text-espresso-700">Your identity is verified. ✓</p>
          ) : (
            <VerifyButton
              label={
                identityStatus === 'pending' || identityStatus === 'rejected'
                  ? 'Try again'
                  : 'Verify my identity'
              }
            />
          )}
        </Step>

        <Step
          number={2}
          title="Criminal background check"
          status={BACKGROUND_COPY[background.status]}
        >
          <p>
            A standard criminal-record check run by an independent screening
            company. You enter your details and sign the consent on their secure
            page — Havenr never sees your Social Security number or the report,
            only whether you passed.
          </p>

          {background.status === 'clear' && (
            <p className="font-semibold text-espresso-700">
              You passed — the “Background checked” badge is on your profile. ✓
            </p>
          )}

          {background.status === 'consider' && (
            <p className="rounded-2xl bg-hv-butter p-4 text-[16px] text-olive-700">
              Your check is being reviewed by our team. We’ll update this page
              as soon as there’s a decision — you don’t need to do anything.
            </p>
          )}

          {background.status === 'processing' && (
            <p className="rounded-2xl bg-hv-butter p-4 text-[16px] text-olive-700">
              Your details were received and the check is running. It usually
              takes a few business days.
            </p>
          )}

          {background.status === 'rejected' && (
            <p className="rounded-2xl bg-red-50 p-4 text-[16px] text-red-800">
              {background.note ??
                'Your background check was not approved. If you think this is a mistake, contact support.'}
            </p>
          )}

          {background.status === 'invited' && background.invitation_url && (
            <a
              href={background.invitation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-hv-ink px-6 text-[18px] font-semibold text-hv-cream hover:bg-hv-cocoa"
            >
              Continue my background check
            </a>
          )}

          {(background.status === 'not_started' || background.status === 'expired') &&
            (checkrReady ? (
              <BackgroundCheckButton
                label={
                  background.status === 'expired'
                    ? 'Start my background check again'
                    : 'Start my background check'
                }
              />
            ) : (
              <p className="rounded-2xl bg-hv-butter p-4 text-[16px] text-olive-700">
                Automatic background checks aren’t turned on yet. The Havenr team
                runs yours directly — you’ll see the result here and get a
                message when it’s done.
              </p>
            ))}
        </Step>
      </div>
    </div>
  );
}
