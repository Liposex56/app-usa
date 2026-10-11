/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

import { links, services, servicesFooter, type ServiceCardContent } from './content';
import { VideoBand } from './video-band';

const byId = Object.fromEntries(services.map((s) => [s.id, s])) as Record<string, ServiceCardContent>;

export function Services() {
  return (
    <section id="services" className="relative overflow-x-clip">
      <VideoBand />

      <div className="relative bg-[linear-gradient(180deg,#f7f5e7_0%,#fbf7dc_45%,#f3f2e2_100%)] pb-12 lg:pb-10">
        {/* Blue ribbon with "WHAT WE OFFER?..." and "5 WAYS TO GET YOUR PET CARED FOR" (Frame 14.svg) */}
        <img
          src="/home/images/ribbon-5-ways.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[-4.3%] top-[-3.7vw] z-10 w-[106%] max-w-none select-none"
        />
        <h2 className="sr-only">What we offer: 5 ways to get your pet cared for</h2>

        <div className="relative mx-auto max-w-[1367px] px-5 pt-[clamp(84px,9.2vw,133px)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr] lg:gap-x-[clamp(20px,2.6vw,37px)]">
            <div className="flex flex-col gap-2">
              <ServiceCard service={byId.boarding} className="lg:min-h-[188px]">
                <img src="/home/images/house.svg" alt="" aria-hidden="true" className="absolute bottom-0 right-[34px] w-[120px]" />
                <Sparkle className="absolute right-[42px] top-[15px] w-[44px]" />
              </ServiceCard>
              <ServiceCard service={byId.daycare} className="lg:min-h-[199px]">
                <img
                  src={byId.daycare.image}
                  alt="Australian shepherd wearing a harness"
                  className="absolute right-1 top-2.5 w-[min(222px,55%)] -scale-x-100"
                />
              </ServiceCard>
            </div>

            <HouseSittingCard service={byId['house-sitting']} />

            <div className="flex flex-col gap-2.5">
              <ServiceCard service={byId['dog-walking']} className="min-h-[284px] lg:min-h-[284px]">
                <img
                  src={byId['dog-walking'].image}
                  alt="West Highland terrier smiling"
                  className="absolute right-1 top-12 w-[min(247px,60%)]"
                />
              </ServiceCard>
              <ServiceCard service={byId['drop-in']} className="grow" compact>
                <Leash className="absolute right-5 top-2 w-[min(190px,38%)]" />
              </ServiceCard>
            </div>
          </div>

          <div className="mt-8 flex items-start justify-between gap-6 text-[clamp(17px,1.55vw,22px)] font-medium uppercase leading-tight lg:mt-[38px] lg:pl-[14px] lg:pr-[4px]">
            <p className="max-w-[300px]">{servicesFooter.left}</p>
            <Link href={links.helpMeChoose} className="uppercase underline-offset-4 hover:underline">
              {servicesFooter.right}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const tones = { greige: 'bg-hv-greige', khaki: 'bg-hv-khaki' };

function ServiceCard({
  service,
  className = '',
  compact = false,
  children,
}: {
  service: ServiceCardContent;
  className?: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={service.href}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[34px] px-5 text-left transition-transform duration-300 hover:-translate-y-1 ${
        compact ? 'min-h-[104px] gap-1 py-4' : 'min-h-[190px] gap-4 pb-5 pt-4'
      } ${tones[service.tone]} ${className}`}
    >
      {children}
      <h3 className="relative text-[clamp(28px,2.6vw,37px)] font-medium uppercase leading-none">{service.title}</h3>
      <p className="relative max-w-[60%] text-[19px] font-medium leading-tight lg:max-w-none">{service.text}</p>
    </Link>
  );
}

// Tall card in the middle: the photo takes the shape of "Vector 5 ways.svg"
// (two rounded rectangles joined together).
function HouseSittingCard({ service }: { service: ServiceCardContent }) {
  return (
    <Link
      href={service.href}
      className={`group relative flex min-h-[320px] flex-col overflow-hidden rounded-[34px] pb-7 text-left transition-transform duration-300 hover:-translate-y-1 lg:min-h-[398px] ${tones[service.tone]}`}
    >
      <svg viewBox="0 0 415 210" className="block w-full shrink-0" aria-hidden="true">
        <defs>
          <clipPath id="house-sitting-shape">
            <path
              transform="translate(-455 0)"
              d="M535.315 27.3232H518.025C495.585 27.3232 477.393 45.5051 477.393 67.9335V155.202C477.393 177.631 495.585 195.813 518.025 195.813H535.315C557.755 195.813 575.946 177.631 575.946 155.202V67.9335C575.946 45.5051 557.755 27.3232 535.315 27.3232Z"
            />
            <path
              transform="translate(-455 0)"
              d="M800.282 29.9153H623.061C597.995 29.9153 577.675 50.2248 577.675 75.2778V153.042C577.675 178.095 597.995 198.405 623.061 198.405H800.282C825.348 198.405 845.668 178.095 845.668 153.042V75.2778C845.668 50.2248 825.348 29.9153 800.282 29.9153Z"
            />
          </clipPath>
        </defs>
        <image
          href={service.image}
          x="22"
          y="27"
          width="369"
          height="172"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#house-sitting-shape)"
        />
      </svg>
      <h3 className="mt-2 px-[39px] text-[clamp(28px,2.6vw,37px)] font-medium uppercase leading-none">{service.title}</h3>
      <p className="mt-auto px-[31px] pt-4 text-[19px] font-medium leading-tight">{service.text}</p>
    </Link>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 42" className={className} fill="none" stroke="white" strokeOpacity=".55" strokeWidth="2" aria-hidden="true">
      <path d="M22 2c1.6 9.6 4.6 13.2 19 18-14.4 3.4-17.2 7.6-19 20-2.2-12.4-5.2-16.6-20-20 14.6-4.6 17.6-8.4 20-18Z" strokeLinejoin="round" />
    </svg>
  );
}

function Leash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 190 80" className={className} fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2" aria-hidden="true">
      <path d="M2 40c18-26 40-30 52-12 10 16-6 30-16 18-9-11 10-30 38-28 26 2 40 26 58 26" strokeLinecap="round" />
      <g fill="white" fillOpacity=".55" stroke="none" transform="translate(146 6)">
        <ellipse cx="22" cy="27" rx="11" ry="9" />
        <ellipse cx="9" cy="14" rx="4.5" ry="6" />
        <ellipse cx="18" cy="7" rx="4.5" ry="6" />
        <ellipse cx="29" cy="8" rx="4.5" ry="6" />
        <ellipse cx="37" cy="17" rx="4.5" ry="6" />
      </g>
    </svg>
  );
}
