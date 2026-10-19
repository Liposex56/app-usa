import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

/** How many notifications the person hasn't opened yet (0 if they can't be read). */
export async function loadUnreadCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}
