import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// No <Database> generic here on purpose: the currently installed
// @supabase/ssr + @supabase/supabase-js resolve every .from(table).select()/
// update()/insert() to `never` when strictly typed against our hand-written
// Database type (a version-drift issue — package.json pins old versions but
// npm still resolves newer ones), which fails the production build outright.
// Row shapes still live in @/lib/database.types and should be applied at
// call sites with `as Xxxxx` casts where useful; RLS is what actually
// enforces access, not these compile-time types.

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Must be created per-request — never hoist it into a module-level constant.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  );
}
