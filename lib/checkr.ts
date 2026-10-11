import { createHmac, timingSafeEqual } from 'node:crypto';

import type { CheckStatus } from '@/lib/database.types';

/**
 * Criminal-background screening through Checkr (the standard US provider for
 * marketplaces like this one).
 *
 * How the flow keeps Havenr on the right side of the rules:
 *  - Havenr never sees or stores an SSN, date of birth or the report itself.
 *    It creates a candidate (name + email) and an *invitation*; the Havener
 *    finishes on Checkr's hosted page, where the FCRA disclosure and consent
 *    are collected, and Checkr runs the check.
 *  - Only the verdict comes back (clear / consider). "Consider" is never an
 *    automatic rejection — adverse decisions need a human and the FCRA
 *    pre-adverse-action notices, which Checkr's dashboard handles. In Havenr a
 *    "consider" lands in the staff queue (/dashboard/admin/background-checks).
 *
 * Like Stripe, this is dormant until configured: with no CHECKR_API_KEY the
 * app says the check "isn't turned on yet" and staff can record results by hand.
 *
 * Env:
 *   CHECKR_API_KEY   secret API key (test or live) — also signs the webhook
 *   CHECKR_PACKAGE   which Checkr package to order (default: tasker_standard)
 *   CHECKR_API_BASE  override for the staging host (https://api.checkr-staging.com/v1)
 */

const DEFAULT_BASE = 'https://api.checkr.com/v1';

export function checkrConfigured(): boolean {
  return Boolean(process.env.CHECKR_API_KEY);
}

function apiKey(): string {
  const key = process.env.CHECKR_API_KEY;
  if (!key) throw new Error('Checkr is not configured');
  return key;
}

async function checkrRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = process.env.CHECKR_API_BASE ?? DEFAULT_BASE;
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey()}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      (typeof json.error === 'string' && json.error) ||
      (Array.isArray(json.error) && json.error.join(', ')) ||
      `Checkr responded with ${response.status}`;
    throw new Error(message);
  }
  return json as T;
}

export type CheckrInvitation = {
  candidateId: string;
  invitationId: string;
  invitationUrl: string;
};

/** Creates the candidate and the hosted invitation the Havener completes. */
export async function createCheckrInvitation(input: {
  firstName: string;
  lastName: string;
  email: string;
  city?: string | null;
  state?: string | null;
}): Promise<CheckrInvitation> {
  const candidate = await checkrRequest<{ id: string }>('/candidates', {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    work_locations: input.state
      ? [{ country: 'US', state: input.state, city: input.city ?? undefined }]
      : undefined,
  });

  const invitation = await checkrRequest<{ id: string; invitation_url: string }>('/invitations', {
    candidate_id: candidate.id,
    package: process.env.CHECKR_PACKAGE ?? 'tasker_standard',
    work_locations: input.state
      ? [{ country: 'US', state: input.state, city: input.city ?? undefined }]
      : undefined,
  });

  return {
    candidateId: candidate.id,
    invitationId: invitation.id,
    invitationUrl: invitation.invitation_url,
  };
}

/** Checkr signs the raw body with HMAC-SHA256 using the API key. */
export function verifyCheckrSignature(rawBody: string, signature: string | null): boolean {
  const key = process.env.CHECKR_API_KEY;
  if (!key || !signature) return false;
  const expected = createHmac('sha256', key).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export type BackgroundCheckStatus =
  | 'not_started'
  | 'invited'
  | 'processing'
  | 'clear'
  | 'consider'
  | 'rejected'
  | 'expired';

/**
 * The status to show for a Havener. Haveners approved before the
 * background_checks table existed only have the profile column, so fall back
 * to it when there is no row.
 */
export function effectiveBackgroundStatus(
  row: { status: BackgroundCheckStatus } | null,
  profileStatus: CheckStatus | null | undefined
): BackgroundCheckStatus {
  if (row) return row.status;
  switch (profileStatus) {
    case 'approved':
      return 'clear';
    case 'pending':
      return 'processing';
    case 'rejected':
      return 'rejected';
    case 'expired':
      return 'expired';
    default:
      return 'not_started';
  }
}

/** What a Checkr event means for a Havenr background check, if anything. */
export function statusFromCheckrEvent(
  type: string,
  objectStatus: string | null
): BackgroundCheckStatus | null {
  switch (type) {
    case 'invitation.completed':
    case 'report.created':
    case 'report.pending':
    case 'report.resumed':
      return 'processing';
    case 'invitation.expired':
      return 'expired';
    case 'report.completed':
      if (objectStatus === 'clear') return 'clear';
      if (objectStatus === 'consider') return 'consider';
      return 'processing';
    case 'report.suspended':
      return 'processing';
    default:
      return null;
  }
}
