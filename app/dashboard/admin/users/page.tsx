import type { Metadata } from 'next';

import type { ProfileRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = { title: 'Users — Admin panel' };

const LIMIT = 100;

function roleBadges(profile: ProfileRow) {
  const badges: Array<{ label: string; tone: string }> = [];
  if (profile.is_owner) badges.push({ label: 'Owner', tone: 'bg-hv-sky/60 text-espresso-700' });
  if (profile.is_havener) badges.push({ label: 'Havener', tone: 'bg-gold-500/15 text-gold-700' });
  if (badges.length === 0) badges.push({ label: 'No role yet', tone: 'bg-espresso-700/8 text-espresso-600' });
  return badges;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q, role } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  const term = q?.trim().replace(/[%,()]/g, ' ');
  if (term) {
    query = query.or(
      `email.ilike.%${term}%,display_name.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    );
  }
  if (role === 'owner') query = query.eq('is_owner', true);
  if (role === 'havener') query = query.eq('is_havener', true);

  const { data } = await query;
  const users = (data ?? []) as ProfileRow[];

  return (
    <div className="space-y-5">
      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search by name or email"
          className="min-w-[14rem] flex-1 rounded-full border border-hv-ink/20 bg-hv-paper px-5 py-2 text-[17px] font-medium text-espresso-700 placeholder:text-espresso-700/40 focus:border-hv-ink focus:outline-none"
        />
        <select
          name="role"
          defaultValue={role ?? ''}
          className="rounded-full border border-hv-ink/20 bg-hv-paper px-4 py-2 text-[17px] font-medium text-espresso-700"
        >
          <option value="">All roles</option>
          <option value="owner">Owners</option>
          <option value="havener">Haveners</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-hv-ink px-6 py-2 text-[17px] font-semibold text-hv-cream hover:bg-hv-cocoa"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-espresso-500">
        {users.length === LIMIT ? `Showing the latest ${LIMIT}.` : `${users.length} user${users.length === 1 ? '' : 's'}.`}
      </p>

      {users.length === 0 ? (
        <p className="rounded-2xl border border-espresso-700/10 bg-hv-paper p-8 text-center text-[17px] text-espresso-500">
          No users match.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-2 rounded-2xl border border-espresso-700/10 bg-hv-paper p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-[18px] font-semibold text-espresso-700">
                  {user.display_name ||
                    `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
                    'Unnamed'}
                </p>
                <p className="truncate text-[16px] text-espresso-500">
                  {user.email ?? '—'}
                  {user.city ? ` · ${[user.city, user.state].filter(Boolean).join(', ')}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {roleBadges(user).map((badge) => (
                  <span
                    key={badge.label}
                    className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${badge.tone}`}
                  >
                    {badge.label}
                  </span>
                ))}
                <span className="text-sm text-espresso-500">
                  Joined {formatDate(user.created_at.slice(0, 10))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
