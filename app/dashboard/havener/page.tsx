import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { IconCheck, IconMapPin, IconShield, IconStar } from '@/components/icons';
import type { SitterProfileRow } from '@/lib/database.types';
import { requireProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Havener profile' };

const STATUS_COPY: Record<SitterProfileRow['status'], { label: string; tone: string }> = {
  draft: { label: 'Draft — not submitted yet', tone: 'bg-espresso-700/8 text-espresso-600' },
  pending_review: { label: 'In review', tone: 'bg-hv-butter text-olive-600' },
  approved: { label: 'Approved — visible to owners', tone: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected — edit and resubmit', tone: 'bg-red-100 text-red-800' },
  suspended: { label: 'Suspended', tone: 'bg-red-100 text-red-800' },
};

const CHECK_LABEL: Record<string, { label: string; tone: string }> = {
  not_started: { label: 'Not started', tone: 'text-espresso-500' },
  pending: { label: 'In progress', tone: 'text-olive-600' },
  approved: { label: 'Done', tone: 'text-green-700' },
  rejected: { label: 'Needs attention', tone: 'text-red-700' },
  expired: { label: 'Expired', tone: 'text-red-700' },
};

function ManageCard({
  href,
  title,
  description,
  status,
}: {
  href: string;
  title: string;
  description: string;
  status?: { label: string; tone: string };
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl border border-espresso-700/8 bg-hv-paper p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-hv-ink/30"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-espresso-700">{title}</h3>
        <span aria-hidden className="text-xl text-espresso-500 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
      <p className="mt-1.5 text-[17px] leading-snug text-espresso-500">{description}</p>
      {status && (
        <p className={`mt-3 text-[16px] font-semibold ${status.tone}`}>{status.label}</p>
      )}
    </Link>
  );
}

export default async function HavenerProfilePage() {
  const profile = await requireProfile();
  if (!profile.is_havener) redirect('/dashboard');

  const supabase = await createClient();
  const { data } = await supabase
    .from('sitter_profiles')
    .select('*')
    .eq('id', profile.id)
    .maybeSingle();

  const sitter = data as SitterProfileRow | null;

  if (!sitter) {
    return (
      <div className="rounded-3xl border border-espresso-700/10 bg-hv-paper p-8 text-center shadow-card">
        <h1 className="text-[clamp(30px,3vw,40px)] leading-none">Create your Havener profile</h1>
        <p className="mx-auto mt-3 max-w-md text-[18px] text-espresso-500">
          You haven’t created your Havener profile yet. Complete it to start
          receiving bookings.
        </p>
        <Link
          href="/dashboard/havener/edit"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-hv-ink px-8 text-[19px] font-semibold text-hv-cream transition-colors hover:bg-hv-cocoa"
        >
          Create my profile
        </Link>
      </div>
    );
  }

  const location = [sitter.service_city, sitter.service_state].filter(Boolean).join(', ');
  const identity = CHECK_LABEL[sitter.identity_status ?? 'not_started'];
  const background = CHECK_LABEL[sitter.background_check_status];
  const insurance = CHECK_LABEL[sitter.insurance_status];

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------- Header */}
      <section className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-sky-100 sm:h-28 sm:w-28">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? 'Havener'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-espresso-500">
                {(profile.display_name ?? 'H').slice(0, 1)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[clamp(30px,3vw,42px)] leading-none">
                {profile.display_name ?? 'Your Havener profile'}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-[15px] font-semibold ${STATUS_COPY[sitter.status].tone}`}
              >
                {STATUS_COPY[sitter.status].label}
              </span>
            </div>
            {sitter.headline && (
              <p className="mt-2 text-xl text-espresso-600">{sitter.headline}</p>
            )}
            {location && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[17px] font-medium text-espresso-500">
                <IconMapPin className="h-4 w-4" />
                {location}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {sitter.insurance_status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[15px] font-semibold text-green-800">
                  <IconShield className="h-3.5 w-3.5" /> Insured
                </span>
              )}
              {sitter.background_check_status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-[15px] font-semibold text-green-800">
                  <IconCheck className="h-3.5 w-3.5" /> Background checked
                </span>
              )}
              {sitter.status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1 text-[15px] font-semibold text-gold-700">
                  <IconStar className="h-3.5 w-3.5" /> Public profile live
                </span>
              )}
            </div>
          </div>

          {sitter.status === 'approved' && (
            <Link
              href={`/sitters/${profile.id}`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-hv-sky px-6 text-[18px] font-semibold text-hv-ink transition-colors hover:bg-[#acd0f0]"
            >
              View my public profile
            </Link>
          )}
        </div>

        {sitter.bio && (
          <p className="mt-6 whitespace-pre-line border-t border-espresso-700/8 pt-5 text-[18px] leading-relaxed text-espresso-600">
            {sitter.bio}
          </p>
        )}
      </section>

      {/* ------------------------------------------------------- Manage */}
      <section>
        <h2 className="text-2xl">Manage your listing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ManageCard
            href="/dashboard/havener/edit"
            title="Edit profile"
            description="Your bio, your home, what you accept and your daily routine."
          />
          <ManageCard
            href="/dashboard/havener/services"
            title="Services & rates"
            description="Turn services on or off and set your prices."
          />
          <ManageCard
            href="/dashboard/havener/availability"
            title="Availability"
            description="Block the days you can’t take bookings."
          />
          <ManageCard
            href="/dashboard/havener/home"
            title="Home photos & video"
            description="Show owners where their pet would stay."
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Trust &amp; payments</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ManageCard
            href="/dashboard/havener/verification"
            title="Identity & background check"
            description="Confirm who you are and complete your background check."
            status={
              sitter.background_check_status === 'approved'
                ? background
                : sitter.identity_status === 'approved'
                  ? { label: 'Identity verified', tone: 'text-green-700' }
                  : identity
            }
          />
          <ManageCard
            href="/dashboard/havener/insurance"
            title="Insurance"
            description="Upload your liability insurance. It stays private."
            status={insurance}
          />
          <ManageCard
            href="/dashboard/havener/payments"
            title="Payments and payouts"
            description="Connect the account where you get paid."
          />
        </div>
      </section>
    </div>
  );
}
