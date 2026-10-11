'use server';

import { redirect } from 'next/navigation';

import { checkrConfigured, createCheckrInvitation } from '@/lib/checkr';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type BackgroundActionState = { error: string | null };

/**
 * Starts the Havener's criminal-background check: asks the screening
 * provider for an invitation and sends them to its hosted page, where they
 * give their details and sign the disclosure. Havenr never handles the SSN.
 * The result comes back through /api/checkr/webhook.
 */
export async function startBackgroundCheckAction(): Promise<BackgroundActionState> {
  const profile = await requireProfile();
  if (!profile.is_havener) return { error: 'Not a Havener account.' };

  if (!checkrConfigured()) {
    return {
      error:
        'Background checks aren’t turned on yet — the Havenr team will run yours directly until they are.',
    };
  }

  const firstName = profile.first_name?.trim();
  const lastName = profile.last_name?.trim();
  if (!firstName || !lastName || !profile.email) {
    return {
      error:
        'We need your legal first and last name and your email on your profile before we can send the check.',
    };
  }

  const supabase = await createClient();
  const { data: sitter } = await supabase
    .from('sitter_profiles')
    .select('service_city, service_state')
    .eq('id', profile.id)
    .maybeSingle();

  let invitation;
  try {
    invitation = await createCheckrInvitation({
      firstName,
      lastName,
      email: profile.email,
      city: sitter?.service_city ?? null,
      state: sitter?.service_state ?? null,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Could not start the background check.',
    };
  }

  const { error } = await supabase.rpc('start_background_check', {
    p_provider: 'checkr',
    p_candidate_id: invitation.candidateId,
    p_invitation_id: invitation.invitationId,
    p_invitation_url: invitation.invitationUrl,
  } as never);
  if (error) return { error: error.message };

  redirect(invitation.invitationUrl);
}
