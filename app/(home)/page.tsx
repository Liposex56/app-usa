import { cookies } from 'next/headers';

import { Closing } from '@/components/home/closing';
import { INTRO_SEEN_COOKIE, intro } from '@/components/home/content';
import { Details } from '@/components/home/details';
import { Faq } from '@/components/home/faq';
import { Hero } from '@/components/home/hero';
import { HomeShell } from '@/components/home/home-shell';
import { HowItWorks } from '@/components/home/how-it-works';
import { Services } from '@/components/home/services';
import { Testimonials } from '@/components/home/testimonials';
import { TrustSafety } from '@/components/home/trust-safety';

export default async function HomePage() {
  const jar = await cookies();
  const showIntro = intro.enabled && !jar.has(INTRO_SEEN_COOKIE);

  return (
    <HomeShell showIntro={showIntro}>
      <Hero />
      <Services />
      <TrustSafety />
      {/* Blue background shared by "How it works", "Details" and the testimonials title */}
      <div className="bg-[linear-gradient(180deg,#d6e6f1_0%,#c6ddf3_45%,#d8e6f0_100%)]">
        <HowItWorks />
        <Details />
        <Testimonials />
      </div>
      <div className="bg-[linear-gradient(180deg,#f7f5e6_0%,#f8f4e0_60%,#f7f5e6_100%)]">
        <Faq />
        <Closing />
      </div>
    </HomeShell>
  );
}
