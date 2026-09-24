import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS entirely. Only ever import
 * this from a server-only context that isn't tied to a signed-in user, like
 * the Stripe webhook route: Stripe calls it directly, with no Havenr
 * session, but still needs to update an arbitrary booking/sitter_profiles
 * row. Never import this from a Server Action or page that runs on a
 * user's behalf — use lib/supabase/server.ts there so RLS keeps doing its
 * job. Requires SUPABASE_SERVICE_ROLE_KEY (from Supabase → Project Settings
 * → API → service_role) in the environment; returns null if it's not set.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
