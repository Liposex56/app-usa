import { createBrowserClient } from '@supabase/ssr';

// See the comment in lib/supabase/server.ts — no <Database> generic here on
// purpose, it collapses every query to `never` with the installed package
// versions.

/** Supabase client for Client Components. Uses the public anon key only. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
