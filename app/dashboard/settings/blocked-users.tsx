import { createClient } from '@/lib/supabase/server';

import { unblockUserAction } from '../bookings/actions';

type BlockedUser = { id: string; display_name: string | null; blocked_at: string };

/**
 * The people this user blocked from a report, so they can undo it. Blocked
 * pairs can't message each other or send new requests.
 */
export async function BlockedUsers() {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc('my_blocked_users');
  const blocked = (data ?? []) as BlockedUser[];
  if (blocked.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl border border-espresso-700/10 bg-hv-paper p-6">
      <h2 className="text-xl">Blocked people</h2>
      <p className="mt-1 text-[17px] text-espresso-500">
        You can’t message each other or send new requests while someone is blocked.
      </p>
      <ul className="mt-4 divide-y divide-espresso-700/8">
        {blocked.map((person) => (
          <li key={person.id} className="flex items-center justify-between gap-3 py-3">
            <span className="text-[17px] font-semibold text-espresso-700">
              {person.display_name ?? 'Havenr user'}
            </span>
            <form action={unblockUserAction}>
              <input type="hidden" name="blockedId" value={person.id} />
              <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">
                Unblock
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
