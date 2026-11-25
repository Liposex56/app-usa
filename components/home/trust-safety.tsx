'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';

import { trust } from './content';

// Width of each closed panel (cqw = % of the width of the panel row)
const CLOSED_WIDTH = 'clamp(56px, 7cqw, 110px)';

export function TrustSafety() {
  // Open panel (the first one, "Background checked", by default)
  const [open, setOpen] = useState(0);

  return (
    <section id="trust" className="relative bg-[linear-gradient(180deg,#f3f2e2_0%,#e4ecea_100%)]">
      <div className="mx-auto max-w-[1440px] px-5 pb-[clamp(48px,6vw,88px)] pt-[clamp(48px,4.7vw,68px)]">
        <h2 className="hv-display text-center text-[clamp(64px,11.4vw,165px)] leading-[0.93]">
          <span className="relative inline-block">
            <Badge label={trust.eyebrow} />
            <span className="relative">{trust.title[0]}</span>
          </span>
          <br />
          {trust.title[1]} <span className="text-hv-mustard">{trust.title[2]}</span>
        </h2>
      </div>

      {/* Horizontal accordion: closed panels are narrow strips at the side.
          Clicking one opens it and closes the one that was open; the text and the
          photo only show in the open panel. */}
      <div className="flex h-[460px] w-full [container-type:inline-size] md:h-[clamp(320px,30.3vw,436px)]">
        {trust.checks.map((check, i) => {
          const isOpen = i === open;
          return (
            <button
              key={check.label}
              type="button"
              onClick={() => setOpen(i)}
              aria-expanded={isOpen}
              className={`group relative h-full overflow-hidden text-left transition-[flex-grow,flex-basis] duration-700 ease-[cubic-bezier(.65,0,.35,1)] motion-reduce:transition-none ${check.bg} ${
                isOpen ? 'cursor-default' : 'cursor-pointer'
              }`}
              style={{ flexGrow: isOpen ? 1 : 0, flexBasis: isOpen ? 0 : CLOSED_WIDTH }}
            >
              {/* Content of the open panel. It has the width of the panel once open so it
                  does not get squeezed while opening or closing. */}
              <div
                aria-hidden={!isOpen}
                className={`absolute inset-y-0 left-0 transition-opacity ${
                  isOpen ? 'opacity-100 delay-300 duration-500' : 'pointer-events-none opacity-0 duration-150'
                }`}
                style={{ width: `calc(100cqw - ${trust.checks.length - 1} * ${CLOSED_WIDTH})` }}
              >
                {check.text && (
                  <p
                    className={`absolute left-16 right-4 top-[7%] text-[clamp(17px,1.8vw,26px)] font-medium uppercase leading-[1.2] md:left-[9.2%] md:right-auto md:top-[24%] md:w-[36%] ${check.textColor}`}
                  >
                    {check.text}
                  </p>
                )}
                {check.image && (
                  <img
                    src={check.image}
                    alt=""
                    loading="lazy"
                    className="absolute bottom-0 left-16 h-[46%] w-[calc(100%-5rem)] object-cover md:left-[47.6%] md:top-0 md:h-full md:w-[39%]"
                  />
                )}
                {check.dog && (
                  <img
                    src="/home/images/dachshund-blue.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-0 right-[3.2%] hidden w-[8.8%] md:block"
                  />
                )}
              </div>

              <span
                className={`absolute bottom-[clamp(24px,3.2vw,46px)] left-[clamp(14px,2.4vw,34px)] rotate-180 whitespace-nowrap text-[clamp(24px,2.8vw,40px)] font-bold uppercase leading-none transition-opacity [writing-mode:vertical-rl] ${check.color} ${
                  isOpen ? '' : 'opacity-80 group-hover:opacity-100'
                }`}
              >
                {check.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// Yellow star with "TRUST & SAFETY" curved, behind the "F" of FOUR.
function Badge({ label }: { label: string }) {
  const points: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    const r = 92 + 8 * Math.cos(a * 12);
    points.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
  }

  return (
    <svg
      viewBox="-180 -180 360 360"
      className="pointer-events-none absolute left-[-0.85em] top-[-0.72em] w-[1.75em] select-none"
      aria-hidden="true"
    >
      <defs>
        <path id="badge-arc" d="M -131.4 -61.3 A 145 145 0 0 1 76.8 -123" />
      </defs>
      <polygon points={points.join(' ')} fill="#fff8cd" />
      <text className="font-display" fontSize="32" fontWeight="500" letterSpacing="3" fill="#26100b">
        <textPath href="#badge-arc">{label.toUpperCase()}</textPath>
      </text>
    </svg>
  );
}
