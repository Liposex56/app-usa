import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconAlert, IconCheck, IconPaw, IconShield } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import type {
  CheckStatus,
  PetRow,
  SitterProfileRow,
  SitterServiceRow,
} from '@/lib/database.types';
import { onboardingPath, requireProfile } from '@/lib/auth';
import { serviceName } from '@/lib/services';
import { createClient } from '@/lib/supabase/server';
import { cn, formatCents, petAge } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Draft — not submitted', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_review: { label: 'In review', tone: 'bg-cream text-olive-600' },
  approved: { label: 'Approved and live', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Needs changes', tone: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspended', tone: 'bg-red-100 text-red-800' },
};

const CHECK_COPY: Record<CheckStatus, string> = {
  not_started: 'Not started',
  pending: 'In progress',
  approved: 'Complete',
  rejected: 'Action needed',
  expired: 'Expired',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const profile = await requireProfile();
  const { welcome } = await searchParams;

  // Send half-finished accounts back to where they stopped.
  if (profile.onboarding_step !== 'done') {
    redirect(onboardingPath(profile));
  }

  const supabase = await createClient();

  const [{ data: pets }, { data: sitter }, { data: services }] =
    await Promise.all([
      supabase
        .from('pets')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('sitter_profiles')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle(),
      supabase.from('sitter_services').select('*').eq('sitter_id', profile.id),
    ]);

  const petList = (pets ?? []) as PetRow[];
  const sitterProfile = sitter as SitterProfileRow | null;
  const serviceList = (services ?? []) as SitterServiceRow[];

  return (
    <div className="space-y-8">
      {welcome && (
        <div className="flex items-start gap-4 rounded-3xl border border-gold-200 bg-cream p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white">
            <IconCheck width={20} height={20} />
          </span>
          <div>
            <h2 className="text-lg text-espresso-700">You’re all set up</h2>
            <p className="mt-1 text-sm leading-relaxed text-espresso-600">
              Search and booking are coming next. In the meantime you can keep
              your pets and your profile up to date here.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl">
          {profile.first_name ? `Hi, ${profile.first_name}` : 'Your dashboard'}
        </h1>
        <p className="mt-2 text-[15px] text-espresso-500">
          {profile.is_owner && profile.is_havener
            ? 'You’re set up as both a pet owner and a Havener.'
            : profile.is_havener
              ? 'Your Havener workspace.'
              : 'Everything about your pets and your bookings.'}
        </p>
      </div>

      {/* ------------------------------------------------------------ Owner */}
      {profile.is_owner && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-xl">My pets</h2>
            <Link
              href="/dashboard/pets/new"
              className="text-sm font-medium text-gold-600 underline underline-offset-4 hover:text-gold-700"
            >
              Add a pet
            </Link>
          </div>

          {petList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-espresso-700/15 bg-white p-10 text-center">
              <IconPaw
                width={32}
                height={32}
                className="mx-auto text-espresso-700/25"
              />
              <p className="mt-4 text-sm text-espresso-500">
                No pets yet. Add one so we can start matching you.
              </p>
              <ButtonLink href="/dashboard/pets/new" size="sm" className="mt-5">
                Add your first pet
              </ButtonLink>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {petList.map((pet) => {
                const flags = [
                  pet.has_anxiety && 'Anxious',
                  pet.is_reactive && 'Reactive',
                  pet.is_escape_risk && 'Escape risk',
                  pet.requires_muzzle && 'Muzzle',
                  pet.medications && 'On medication',
                ].filter(Boolean) as string[];

                return (
                  <article
                    key={pet.id}
                    className="rounded-3xl border border-espresso-700/8 bg-white p-6 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg text-espresso-700">{pet.name}</h3>
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                        {pet.species === 'dog' ? 'Dog' : 'Cat'}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-espresso-500">
                      {[pet.breed, petAge(pet.birthdate), pet.size]
                        .filter(Boolean)
                        .join(' · ') || 'Profile started'}
                    </p>

                    {flags.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {flags.map((flag) => (
                          <li
                            key={flag}
                            className="rounded-full bg-cream px-2.5 py-1 text-xs text-olive-600"
                          >
                            {flag}
                          </li>
                        ))}
                      </ul>
                    )}

                    {!pet.vaccinated_through && (
                      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-olive-600">
                        <IconAlert width={15} height={15} className="mt-px shrink-0" />
                        Add vaccination records before your first booking.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ---------------------------------------------------------- Havener */}
      {profile.is_havener && (
        <section>
          <h2 className="mb-4 text-xl">Havener profile</h2>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="rounded-3xl border border-espresso-700/8 bg-white p-7 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg text-espresso-700">Listing status</h3>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium',
                    STATUS_COPY[sitterProfile?.status ?? 'draft']?.tone
                  )}
                >
                  {STATUS_COPY[sitterProfile?.status ?? 'draft']?.label}
                </span>
              </div>

              {sitterProfile?.status === 'pending_review' && (
                <p className="mt-3 text-sm leading-relaxed text-espresso-500">
                  Our team is reviewing your profile. We’ll email you as soon as
                  there’s an update, and we’ll reach out to schedule your
                  interview.
                </p>
              )}
              {sitterProfile?.status === 'rejected' &&
                sitterProfile.rejection_reason && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                    {sitterProfile.rejection_reason}
                  </p>
                )}

              {serviceList.length > 0 && (
                <div className="mt-6 border-t border-espresso-700/8 pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-500">
                    Your services
                  </h4>
                  <ul className="mt-4 space-y-2.5">
                    {serviceList.map((service) => (
                      <li
                        key={service.id}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-espresso-700">
                          {serviceName(service.service_type)}
                        </span>
                        <span className="font-medium text-espresso-700">
                          {formatCents(service.base_rate_cents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ButtonLink
                href="/dashboard/havener"
                variant="secondary"
                size="sm"
                className="mt-6"
              >
                Edit profile
              </ButtonLink>
            </div>

            <div className="rounded-3xl bg-espresso-700 p-7 text-cream">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cream/10 text-gold-400">
                <IconShield width={20} height={20} />
              </span>
              <h3 className="mt-4 text-lg text-cream">Verification</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cream/60">
                All four must be complete before you can take bookings.
              </p>

              <ul className="mt-5 space-y-3">
                {(
                  [
                    ['Background check', sitterProfile?.background_check_status],
                    ['Interview', sitterProfile?.interview_status],
                    ['Home verification', sitterProfile?.home_check_status],
                    ['Insurance', sitterProfile?.insurance_status],
                  ] as Array<[string, CheckStatus | undefined]>
                ).map(([label, status]) => {
                  const value = status ?? 'not_started';
                  return (
                    <li
                      key={label}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-cream/80">{label}</span>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs',
                          value === 'approved'
                            ? 'bg-gold-500 text-white'
                            : 'bg-cream/10 text-cream/60'
                        )}
                      >
                        {CHECK_COPY[value]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- Roadmap */}
      <section className="rounded-3xl border border-sky-200 bg-sky-50 p-7">
        <h2 className="text-lg text-espresso-700">Coming next</h2>
        <p className="mt-2 text-sm leading-relaxed text-espresso-600">
          Search with compatibility filters, the booking flow, in-app chat,
          payments, GPS-tracked walks and service reports are the next phases of
          the build.
        </p>
      </section>
    </div>
  );
}
