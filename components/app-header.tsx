import { SignedInHeader } from '@/components/signed-in-header';
import { SiteHeader } from '@/components/site-header';
import { buildNavLinks } from '@/lib/nav';
import { createClient } from '@/lib/supabase/server';

/**
 * The top bar for the public pages. Signed out: the marketing navigation.
 * Signed in: the very same bar as the dashboard, so moving between a public
 * profile, the search and the dashboard keeps the same buttons in the same
 * place (and the way back to the dashboard).
 */
export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <SiteHeader isSignedIn={false} />;

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_owner, is_havener, display_name, first_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('staff_members').select('role').eq('user_id', user.id).maybeSingle(),
  ]);

  // Signed in but no profile row yet (still onboarding): keep the simple bar.
  if (!profile) return <SiteHeader isSignedIn />;

  return (
    <SignedInHeader
      links={buildNavLinks(profile, Boolean(staff))}
      name={profile.display_name ?? profile.first_name ?? 'Your account'}
    />
  );
}
