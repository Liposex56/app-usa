import { NextResponse } from 'next/server';

import {
  checkrConfigured,
  statusFromCheckrEvent,
  verifyCheckrSignature,
} from '@/lib/checkr';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

type CheckrEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      status?: string | null;
      candidate_id?: string;
      invitation_id?: string;
    };
  };
};

/**
 * Checkr webhook: keeps a Havener's background check in step with the
 * screening. Only the verdict is stored. A "consider" result is *not* turned
 * into a rejection here — it waits in the staff queue for a human decision.
 *
 * Quiet (200) while Checkr isn't configured, like the Stripe webhook, so a
 * provider that retries doesn't disable the endpoint before there are keys.
 */
export async function POST(request: Request) {
  if (!checkrConfigured()) {
    return NextResponse.json({ received: true, skipped: 'not_configured' });
  }

  const raw = await request.text();
  if (!verifyCheckrSignature(raw, request.headers.get('x-checkr-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: CheckrEvent;
  try {
    event = JSON.parse(raw) as CheckrEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const object = event.data?.object;
  const status = statusFromCheckrEvent(event.type ?? '', object?.status ?? null);
  if (!status || !object) {
    return NextResponse.json({ received: true, ignored: event.type ?? 'unknown' });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ received: true, skipped: 'no_service_role_key' });
  }

  // Reports carry the candidate id; invitations carry their own id.
  const isInvitation = (event.type ?? '').startsWith('invitation.');
  const column = isInvitation ? 'provider_invitation_id' : 'provider_candidate_id';
  const value = isInvitation ? object.id : object.candidate_id;
  if (!value) {
    return NextResponse.json({ received: true, ignored: 'no_reference' });
  }

  const patch: Record<string, unknown> = { status };
  if (!isInvitation && object.id) patch.provider_report_id = object.id;
  if (status === 'clear' || status === 'consider') {
    patch.completed_at = new Date().toISOString();
  }

  // A staff decision (rejected) is final: later provider events don't undo it.
  const { error } = await supabase
    .from('background_checks')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq(column, value)
    .neq('status', 'rejected');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
